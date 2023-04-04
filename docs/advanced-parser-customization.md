---
title: Advanced Parser Customization
sidebar_position: 15
---

Beautiful Soup offers a number of ways to customize how the parser treats incoming HTML and XML. This section covers the most commonly used customization techniques.

## Parsing only part of a document

Let’s say you want to use Beautiful Soup look at a document’s **a** tags. It’s a waste of time and memory to parse the entire document and then go over it again looking for **a** tags. It would be much faster to ignore everything that wasn’t an **a** tag in the first place. The SoupStrainer class allows you to choose which parts of an incoming document are parsed. You just create a SoupStrainer and pass it in to the BeautifulSoup constructor as the `parse_only` argument.

(Note that *this feature won’t work if you’re using the html5lib parser*. If you use html5lib, the whole document will be parsed, no matter what. This is because html5lib constantly rearranges the parse tree as it works, and if some part of the document didn’t actually make it into the parse tree, it’ll crash. To avoid confusion, in the examples below I’ll be forcing Beautiful Soup to use Python’s built-in parser.)


### class bs4.SoupStrainer

The SoupStrainer class takes the same arguments as a typical method from Searching the tree: name, attrs, string, and **kwargs. Here are three SoupStrainer objects:

```python
from bs4 import SoupStrainer

only_a_tags = SoupStrainer("a")

only_tags_with_id_link2 = SoupStrainer(id="link2")

def is_short_string(string):
    return string is not None and len(string) < 10

only_short_strings = SoupStrainer(string=is_short_string)
```

I’m going to bring back the “three sisters” document one more time, and we’ll see what the document looks like when it’s parsed with these three SoupStrainer objects:

```python
html_doc = """<html><head><title>The Dormouse's story</title></head>
<body>
<p class="title"><b>The Dormouse's story</b></p>

<p class="story">Once upon a time there were three little sisters; and their names were
<a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>,
<a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
<a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
and they lived at the bottom of a well.</p>

<p class="story">...</p>
"""

print(BeautifulSoup(html_doc, "html.parser", parse_only=only_a_tags).prettify())
# <a class="sister" href="http://example.com/elsie" id="link1">
#  Elsie
# </a>
# <a class="sister" href="http://example.com/lacie" id="link2">
#  Lacie
# </a>
# <a class="sister" href="http://example.com/tillie" id="link3">
#  Tillie
# </a>

print(BeautifulSoup(html_doc, "html.parser", parse_only=only_tags_with_id_link2).prettify())
# <a class="sister" href="http://example.com/lacie" id="link2">
#  Lacie
# </a>

print(BeautifulSoup(html_doc, "html.parser", parse_only=only_short_strings).prettify())
# Elsie
# ,
# Lacie
# and
# Tillie
# ...
#
```

You can also pass a SoupStrainer into any of the methods covered in Searching the tree. This probably isn’t terribly useful, but I thought I’d mention it:

```python
soup = BeautifulSoup(html_doc, 'html.parser')
soup.find_all(only_short_strings)
# ['\n\n', '\n\n', 'Elsie', ',\n', 'Lacie', ' and\n', 'Tillie',
#  '\n\n', '...', '\n']
```

## Customizing multi-valued attributes

In an HTML document, an attribute like `class` is given a list of values, and an attribute like `id` is given a single value, because the HTML specification treats those attributes differently:

```python
markup = '<a class="cls1 cls2" id="id1 id2">'
soup = BeautifulSoup(markup, 'html.parser')
soup.a['class']
# ['cls1', 'cls2']
soup.a['id']
# 'id1 id2'
```

You can turn this off by passing in `multi_valued_attributes=None`. Than all attributes will be given a single value:

```python
soup = BeautifulSoup(markup, 'html.parser', multi_valued_attributes=None)
soup.a['class']
# 'cls1 cls2'
soup.a['id']
# 'id1 id2'
```

You can customize this behavior quite a bit by passing in a dictionary for `multi_valued_attributes`. If you need this, look at `HTMLTreeBuilder.DEFAULT_CDATA_LIST_ATTRIBUTES` to see the configuration Beautiful Soup uses by default, which is based on the HTML specification.

*(This is a new feature in Beautiful Soup 4.8.0.)*

## Handling duplicate attributes

When using the `html.parser` parser, you can use the `on_duplicate_attribute` constructor argument to customize what Beautiful Soup does when it encounters a tag that defines the same attribute more than once:

```python
markup = '<a href="http://url1/" href="http://url2/">'
```

The default behavior is to use the last value found for the tag:

```python
soup = BeautifulSoup(markup, 'html.parser')
soup.a['href']
# http://url2/

soup = BeautifulSoup(markup, 'html.parser', on_duplicate_attribute='replace')
soup.a['href']
# http://url2/
```

With `on_duplicate_attribute='ignore'` you can tell Beautiful Soup to use the *first* value found and ignore the rest:

```python
soup = BeautifulSoup(markup, 'html.parser', on_duplicate_attribute='ignore')
soup.a['href']
# http://url1/
```

(lxml and html5lib always do it this way; their behavior can’t be configured from within Beautiful Soup.)

If you need more, you can pass in a function that’s called on each duplicate value:

```python
def accumulate(attributes_so_far, key, value):
    if not isinstance(attributes_so_far[key], list):
        attributes_so_far[key] = [attributes_so_far[key]]
    attributes_so_far[key].append(value)

soup = BeautifulSoup(markup, 'html.parser', on_duplicate_attribute=accumulate)
soup.a['href']
# ["http://url1/", "http://url2/"]
```

*(This is a new feature in Beautiful Soup 4.9.1.)*

## Instantiating custom subclasses

When a parser tells Beautiful Soup about a tag or a string, Beautiful Soup will instantiate a Tag or NavigableString object to contain that information. Instead of that default behavior, you can tell Beautiful Soup to instantiate subclasses of Tag or NavigableString, subclasses you define with custom behavior:

```python
from bs4 import Tag, NavigableString
class MyTag(Tag):
    pass


class MyString(NavigableString):
    pass


markup = "<div>some text</div>"
soup = BeautifulSoup(markup, 'html.parser')
isinstance(soup.div, MyTag)
# False
isinstance(soup.div.string, MyString)
# False

my_classes = { Tag: MyTag, NavigableString: MyString }
soup = BeautifulSoup(markup, 'html.parser', element_classes=my_classes)
isinstance(soup.div, MyTag)
# True
isinstance(soup.div.string, MyString)
# True
```

This can be useful when incorporating Beautiful Soup into a test framework.

*(This is a new feature in Beautiful Soup 4.8.1.)*