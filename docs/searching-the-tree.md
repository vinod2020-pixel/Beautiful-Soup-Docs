---
title: Searching the Tree
sidebar_position: 7
---

Beautiful Soup defines a lot of methods for searching the parse tree, but they’re all very similar. I’m going to spend a lot of time explaining the two most popular methods: `find()` and `find_all()`. The other methods take almost exactly the same arguments, so I’ll just cover them briefly.

Once again, I’ll be using the “three sisters” document as an example:

```python
html_doc = """
<html><head><title>The Dormouse's story</title></head>
<body>
<p class="title"><b>The Dormouse's story</b></p>

<p class="story">Once upon a time there were three little sisters; and their names were
<a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>,
<a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
<a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
and they lived at the bottom of a well.</p>

<p class="story">...</p>
"""

from bs4 import BeautifulSoup
soup = BeautifulSoup(html_doc, 'html.parser')
```

By passing in a filter to an argument like `find_all()`, you can zoom in on the parts of the document you’re interested in.

## Kinds of filters

Before talking in detail about `find_all()` and similar methods, I want to show examples of different filters you can pass into these methods. These filters show up again and again, throughout the search API. You can use them to filter based on a tag’s name, on its attributes, on the text of a string, or on some combination of these.

### A string

The simplest filter is a string. Pass a string to a search method and Beautiful Soup will perform a match against that exact string. This code finds all the **b** tags in the document:

```python
soup.find_all('b')
# [<b>The Dormouse's story</b>]
```

If you pass in a byte string, Beautiful Soup will assume the string is encoded as UTF-8. You can avoid this by passing in a Unicode string instead.

### A regular expression

If you pass in a regular expression object, Beautiful Soup will filter against that regular expression using its `search()` method. This code finds all the tags whose names start with the letter “b”; in this case, the **body** tag and the **b** tag:

```python
import re
for tag in soup.find_all(re.compile("^b")):
    print(tag.name)
# body
# b
```

This code finds all the tags whose names contain the letter ‘t’:

```python
for tag in soup.find_all(re.compile("t")):
    print(tag.name)
# html
# title
```

### A list

If you pass in a list, Beautiful Soup will allow a string match against any item in that list. This code finds all the **a** tags and all the **b** tags:

```python
soup.find_all(["a", "b"])
# [<b>The Dormouse's story</b>,
#  <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

### True

The value `True` matches everything it can. This code finds all the tags in the document, but none of the text strings:

```python
for tag in soup.find_all(True):
    print(tag.name)
# html
# head
# title
# body
# p
# b
# p
# a
# a
# a
# p
```

### A function

If none of the other matches work for you, define a function that takes an element as its only argument. The function should return `True` if the argument matches, and `False` otherwise.

Here’s a function that returns `True` if a tag defines the “class” attribute but doesn’t define the “id” attribute:

```python
def has_class_but_no_id(tag):
    return tag.has_attr('class') and not tag.has_attr('id')
```

Pass this function into `find_all()` and you’ll pick up all the **p** tags:

```python
soup.find_all(has_class_but_no_id)
# [<p class="title"><b>The Dormouse's story</b></p>,
#  <p class="story">Once upon a time there were…bottom of a well.</p>,
#  <p class="story">...</p>]
```

This function only picks up the **p** tags. It doesn’t pick up the **a** tags, because those tags define both “class” and “id”. It doesn’t pick up tags like **html** and **title**, because those tags don’t define “class”.

If you pass in a function to filter on a specific attribute like `href`, the argument passed into the function will be the attribute value, not the whole tag. Here’s a function that finds all `a` tags whose `href` attribute does not match a regular expression:

```python
import re
def not_lacie(href):
    return href and not re.compile("lacie").search(href)

soup.find_all(href=not_lacie)
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

The function can be as complicated as you need it to be. Here’s a function that returns `True` if a tag is surrounded by string objects:

```python
from bs4 import NavigableString
def surrounded_by_strings(tag):
    return (isinstance(tag.next_element, NavigableString)
            and isinstance(tag.previous_element, NavigableString))

for tag in soup.find_all(surrounded_by_strings):
    print(tag.name)
# body
# p
# a
# a
# a
# p
```

Now we’re ready to look at the search methods in detail.

## find_all()

Method signature: find_all(name, attrs, recursive, string, limit, **kwargs)

The `find_all()` method looks through a tag’s descendants and retrieves all descendants that match your filters. I gave several examples in Kinds of filters, but here are a few more:

```python
soup.find_all("title")
# [<title>The Dormouse's story</title>]

soup.find_all("p", "title")
# [<p class="title"><b>The Dormouse's story</b></p>]

soup.find_all("a")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.find_all(id="link2")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]

import re
soup.find(string=re.compile("sisters"))
# 'Once upon a time there were three little sisters; and their names were\n'
```

Some of these should look familiar, but others are new. What does it mean to pass in a value for `string`, or `id`? Why does `find_all("p", "title")` find a **p** tag with the CSS class “title”? Let’s look at the arguments to `find_all()`.

### The name argument

Pass in a value for `name` and you’ll tell Beautiful Soup to only consider tags with certain names. Text strings will be ignored, as will tags whose names that don’t match.

This is the simplest usage:

```python
soup.find_all("title")
# [<title>The Dormouse's story</title>]
```

Recall from Kinds of filters that the value to `name` can be a string, a regular expression, a list, a function, or the value True.

### The keyword arguments

Any argument that’s not recognized will be turned into a filter on one of a tag’s attributes. If you pass in a value for an argument called `id`, Beautiful Soup will filter against each tag’s ‘id’ attribute:

```python
soup.find_all(id='link2')
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]
```

If you pass in a value for `href`, Beautiful Soup will filter against each tag’s ‘href’ attribute:

```python
soup.find_all(href=re.compile("elsie"))
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]
```

You can filter an attribute based on a string, a regular expression, a list, a function, or the value True.

This code finds all tags whose `id` attribute has a value, regardless of what the value is:

```python
soup.find_all(id=True)
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

You can filter multiple attributes at once by passing in more than one keyword argument:

```python
soup.find_all(href=re.compile("elsie"), id='link1')
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]
```

Some attributes, like the data-* attributes in HTML 5, have names that can’t be used as the names of keyword arguments:

```python
data_soup = BeautifulSoup('<div data-foo="value">foo!</div>', 'html.parser')
data_soup.find_all(data-foo="value")
# SyntaxError: keyword can't be an expression
```

You can use these attributes in searches by putting them into a dictionary and passing the dictionary into `find_all()` as the `attrs` argument:

```python
data_soup.find_all(attrs={"data-foo": "value"})
# [<div data-foo="value">foo!</div>]
```

You can’t use a keyword argument to search for HTML’s ‘name’ element, because Beautiful Soup uses the `name` argument to contain the name of the tag itself. Instead, you can give a value to ‘name’ in the `attrs` argument:

```python
name_soup = BeautifulSoup('<input name="email"/>', 'html.parser')
name_soup.find_all(name="email")
# []
name_soup.find_all(attrs={"name": "email"})
# [<input name="email"/>]
```

### Searching by CSS class

It’s very useful to search for a tag that has a certain CSS class, but the name of the CSS attribute, “class”, is a reserved word in Python. Using class as a keyword argument will give you a syntax error. As of Beautiful Soup 4.1.2, you can search by CSS class using the keyword argument `class_`:

```python
soup.find_all("a", class_="sister")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

As with any keyword argument, you can pass `class_` a string, a regular expression, a function, or `True`:

```python
soup.find_all(class_=re.compile("itl"))
# [<p class="title"><b>The Dormouse's story</b></p>]

def has_six_characters(css_class):
    return css_class is not None and len(css_class) == 6

soup.find_all(class_=has_six_characters)
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

Remember that a single tag can have multiple values for its “class” attribute. When you search for a tag that matches a certain CSS class, you’re matching against *any* of its CSS classes:

```python
css_soup = BeautifulSoup('<p class="body strikeout"></p>', 'html.parser')
css_soup.find_all("p", class_="strikeout")
# [<p class="body strikeout"></p>]

css_soup.find_all("p", class_="body")
# [<p class="body strikeout"></p>]
```

You can also search for the exact string value of the `class` attribute:

```python
css_soup.find_all("p", class_="body strikeout")
# [<p class="body strikeout"></p>]
```

But searching for variants of the string value won’t work:

```python
css_soup.find_all("p", class_="strikeout body")
# []
```

If you want to search for tags that match two or more CSS classes, you should use a CSS selector:

```python
css_soup.select("p.strikeout.body")
# [<p class="body strikeout"></p>]
```

In older versions of Beautiful Soup, which don’t have the `class_` shortcut, you can use the `attrs` trick mentioned above. Create a dictionary whose value for “class” is the string (or regular expression, or whatever) you want to search for:

```python
soup.find_all("a", attrs={"class": "sister"})
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

### The string argument

With `string` you can search for strings instead of tags. As with `name` and the keyword arguments, you can pass in a string, a regular expression, a list, a function, or the value True. Here are some examples:

```python
soup.find_all(string="Elsie")
# ['Elsie']

soup.find_all(string=["Tillie", "Elsie", "Lacie"])
# ['Elsie', 'Lacie', 'Tillie']

soup.find_all(string=re.compile("Dormouse"))
# ["The Dormouse's story", "The Dormouse's story"]

def is_the_only_string_within_a_tag(s):
    """Return True if this string is the only child of its parent tag."""
    return (s == s.parent.string)

soup.find_all(string=is_the_only_string_within_a_tag)
# ["The Dormouse's story", "The Dormouse's story", 'Elsie', 'Lacie', 'Tillie', '...']
```

Although `string` is for finding strings, you can combine it with arguments that find tags: Beautiful Soup will find all tags whose `.string` matches your value for `string`. This code finds the **a** tags whose `.string` is “Elsie”:

```python
soup.find_all("a", string="Elsie")
# [<a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>]
```

The `string` argument is new in Beautiful Soup 4.4.0. In earlier versions it was called `text`:

```python
soup.find_all("a", text="Elsie")
# [<a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>]
```

### The limit argument

`find_all()` returns all the tags and strings that match your filters. This can take a while if the document is large. If you don’t need all the results, you can pass in a number for `limit`. This works just like the LIMIT keyword in SQL. It tells Beautiful Soup to stop gathering results after it’s found a certain number.

There are three links in the “three sisters” document, but this code only finds the first two:

```python
soup.find_all("a", limit=2)
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]
```

### The recursive argument

If you call `mytag.find_all()`, Beautiful Soup will examine all the descendants of `mytag`: its children, its children’s children, and so on. If you only want Beautiful Soup to consider direct children, you can pass in `recursive=False`. See the difference here:

```python
soup.html.find_all("title")
# [<title>The Dormouse's story</title>]

soup.html.find_all("title", recursive=False)
# []
```

Here’s that part of the document:

```python
<html>
 <head>
  <title>
   The Dormouse's story
  </title>
 </head>
...
```

The **title** tag is beneath the **html** tag, but it’s not directly beneath the **html** tag: the **head** tag is in the way. Beautiful Soup finds the **title** tag when it’s allowed to look at all descendants of the **html** tag, but when `recursive=False` restricts it to the **html** tag’s immediate children, it finds nothing.

Beautiful Soup offers a lot of tree-searching methods (covered below), and they mostly take the same arguments as `find_all()`: `name`, `attrs`, `string`, `limit`, and the keyword arguments. But the `recursive` argument is different: `find_all()` and `find()` are the only methods that support it. Passing `recursive=False` into a method like `find_parents()` wouldn’t be very useful.

## Calling a tag is like calling find_all()

Because `find_all()` is the most popular method in the Beautiful Soup search API, you can use a shortcut for it. If you treat the BeautifulSoup object or a Tag object as though it were a function, then it’s the same as calling `find_all()` on that object. These two lines of code are equivalent:

```python
soup.find_all("a")
soup("a")
```

These two lines are also equivalent:

```python
soup.title.find_all(string=True)
soup.title(string=True)
```

## find()

Method signature: find(name, attrs, recursive, string, **kwargs)

The `find_all()` method scans the entire document looking for results, but sometimes you only want to find one result. If you know a document only has one **body** tag, it’s a waste of time to scan the entire document looking for more. Rather than passing in `limit=1` every time you call `find_all`, you can use the `find()` method. These two lines of code are *nearly* equivalent:

```python
soup.find_all('title', limit=1)
# [<title>The Dormouse's story</title>]

soup.find('title')
# <title>The Dormouse's story</title>
```

The only difference is that `find_all()` returns a list containing the single result, and `find()` just returns the result.

If `find_all()` can’t find anything, it returns an empty list. If `find()` can’t find anything, it returns None:

```python
print(soup.find("nosuchtag"))
# None
```

Remember the `soup.head.title` trick from Navigating using tag names? That trick works by repeatedly calling `find()`:

```python
soup.head.title
# <title>The Dormouse's story</title>

soup.find("head").find("title")
# <title>The Dormouse's story</title>
```

## find_parents() and find_parent()

Method signature: find_parents(name, attrs, string, limit, **kwargs)

Method signature: find_parent(name, attrs, string, **kwargs)

I spent a lot of time above covering `find_all()` and `find()`. The Beautiful Soup API defines ten other methods for searching the tree, but don’t be afraid. Five of these methods are basically the same as `find_all()`, and the other five are basically the same as `find()`. The only differences are in what parts of the tree they search.

First let’s consider `find_parents() `and `find_parent()`. Remember that `find_all()` and `find()` work their way down the tree, looking at tag’s descendants. These methods do the opposite: they work their way *up* the tree, looking at a tag’s (or a string’s) parents. Let’s try them out, starting from a string buried deep in the “three daughters” document:

```python
a_string = soup.find(string="Lacie")
a_string
# 'Lacie'

a_string.find_parents("a")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]

a_string.find_parent("p")
# <p class="story">Once upon a time there were three little sisters; and their names were
#  <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a> and
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>;
#  and they lived at the bottom of a well.</p>

a_string.find_parents("p", class_="title")
# []
```

One of the three **a** tags is the direct parent of the string in question, so our search finds it. One of the three **p** tags is an indirect parent of the string, and our search finds that as well. There’s a **p** tag with the CSS class “title” *somewhere* in the document, but it’s not one of this string’s parents, so we can’t find it with find_parents().

You may have made the connection between `find_parent()` and `find_parents()`, and the .parent and .parents attributes mentioned earlier. The connection is very strong. These search methods actually use `.parents` to iterate over all the parents, and check each one against the provided filter to see if it matches.

## find_next_siblings() and find_next_sibling()

Method signature: find_next_siblings(name, attrs, string, limit, **kwargs)

Method signature: find_next_sibling(name, attrs, string, **kwargs)

These methods use .next_siblings to iterate over the rest of an element’s siblings in the tree. The `find_next_siblings()` method returns all the siblings that match, and `find_next_sibling()` only returns the first one:

```python
first_link = soup.a
first_link
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>

first_link.find_next_siblings("a")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

first_story_paragraph = soup.find("p", "story")
first_story_paragraph.find_next_sibling("p")
# <p class="story">...</p>
```

## find_previous_siblings() and find_previous_sibling()

Method signature: find_previous_siblings(name, attrs, string, limit, **kwargs)

Method signature: find_previous_sibling(name, attrs, string, **kwargs)

These methods use .previous_siblings to iterate over an element’s siblings that precede it in the tree. The `find_previous_siblings()` method returns all the siblings that match, and `find_previous_sibling()` only returns the first one:

```python
last_link = soup.find("a", id="link3")
last_link
# <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>

last_link.find_previous_siblings("a")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]

first_story_paragraph = soup.find("p", "story")
first_story_paragraph.find_previous_sibling("p")
# <p class="title"><b>The Dormouse's story</b></p>
```

## find_all_next() and find_next()

Method signature: find_all_next(name, attrs, string, limit, **kwargs)

Method signature: find_next(name, attrs, string, **kwargs)

These methods use .next_elements to iterate over whatever tags and strings that come after it in the document. The `find_all_next()` method returns all matches, and `find_next()` only returns the first match:

```python
first_link = soup.a
first_link
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>

first_link.find_all_next(string=True)
# ['Elsie', ',\n', 'Lacie', ' and\n', 'Tillie',
#  ';\nand they lived at the bottom of a well.', '\n', '...', '\n']

first_link.find_next("p")
# <p class="story">...</p>
```

In the first example, the string “Elsie” showed up, even though it was contained within the **a** tag we started from. In the second example, the last **p** tag in the document showed up, even though it’s not in the same part of the tree as the **a** tag we started from. For these methods, all that matters is that an element match the filter, and show up later in the document than the starting element.

## find_all_previous() and find_previous()

Method signature: find_all_previous(name, attrs, string, limit, **kwargs)

Method signature: find_previous(name, attrs, string, **kwargs)

These methods use .previous_elements to iterate over the tags and strings that came before it in the document. The `find_all_previous()` method returns all matches, and `find_previous()` only returns the first match:

```python
first_link = soup.a
first_link
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>

first_link.find_all_previous("p")
# [<p class="story">Once upon a time there were three little sisters; ...</p>,
#  <p class="title"><b>The Dormouse's story</b></p>]

first_link.find_previous("title")
# <title>The Dormouse's story</title>
```

The call to find_all_previous("p") found the first paragraph in the document (the one with class=”title”), but it also finds the second paragraph, the **p** tag that contains the **a** tag we started with. This shouldn’t be too surprising: we’re looking at all the tags that show up earlier in the document than the one we started with. A **p** tag that contains an **a** tag must have shown up before the **a** tag it contains.

## CSS selectors through the .css property

BeautifulSoup and Tag objects support CSS selectors through their `.css` property. The actual selector implementation is handled by the Soup Sieve package, available on PyPI as `soupsieve`. If you installed Beautiful Soup through `pip`, Soup Sieve was installed at the same time, so you don’t have to do anything extra.

The Soup Sieve documentation lists all the currently supported CSS selectors, but here are some of the basics. You can find tags:

```python
soup.css.select("title")
# [<title>The Dormouse's story</title>]

soup.css.select("p:nth-of-type(3)")
# [<p class="story">...</p>]
```

Find tags beneath other tags:

```python
soup.css.select("body a")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie"  id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.css.select("html head title")
# [<title>The Dormouse's story</title>]
```

Find tags directly *beneath* other tags:

```python
soup.css.select("head > title")
# [<title>The Dormouse's story</title>]

soup.css.select("p > a")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie"  id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.css.select("p > a:nth-of-type(2)")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]

soup.css.select("p > #link1")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]

soup.css.select("body > a")
# []
```

Find the siblings of tags:

```python
soup.css.select("#link1 ~ .sister")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie"  id="link3">Tillie</a>]

soup.css.select("#link1 + .sister")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]
```

Find tags by CSS class:

```python
soup.css.select(".sister")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.css.select("[class~=sister]")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

Find tags by ID:

```python
soup.css.select("#link1")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]

soup.css.select("a#link2")
# [<a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]
```

Find tags that match any selector from a list of selectors:

```python
soup.css.select("#link1,#link2")
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>]
```

Test for the existence of an attribute:

```python
soup.css.select('a[href]')
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

Find tags by attribute value:

```python
soup.css.select('a[href="http://example.com/elsie"]')
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]

soup.css.select('a[href^="http://example.com/"]')
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.css.select('a[href$="tillie"]')
# [<a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.css.select('a[href*=".com/el"]')
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>]
```

There’s also a method called `select_one()`, which finds only the first tag that matches a selector:

```python
soup.css.select_one(".sister")
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>
```

As a convenience, you can call `select()` and `select_one()` can directly on the BeautifulSoup or Tag object, omitting the `.css` property:

```python
soup.select('a[href$="tillie"]')
# [<a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]

soup.select_one(".sister")
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>
```

CSS selector support is a convenience for people who already know the CSS selector syntax. You can do all of this with the Beautiful Soup API. If CSS selectors are all you need, you should skip Beautiful Soup altogether and parse the document with `lxml`: it’s a lot faster. But Soup Sieve lets you *combine* CSS selectors with the Beautiful Soup API.

### Advanced Soup Sieve features

Soup Sieve offers a substantial API beyond the `select()` and `select_one()` methods, and you can access most of that API through the `.css` attribute of Tag or BeautifulSoup. What follows is just a list of the supported methods; see the Soup Sieve documentation for full documentation.

The `iselect()` method works the same as `select()`, but it returns a generator instead of a list:

```python
[tag['id'] for tag in soup.css.iselect(".sister")]
# ['link1', 'link2', 'link3']
```

The `closest()` method returns the nearest parent of a given Tag that matches a CSS selector, similar to Beautiful Soup’s `find_parent()` method:

```python
elsie = soup.css.select_one(".sister")
elsie.css.closest("p.story")
# <p class="story">Once upon a time there were three little sisters; and their names were
#  <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a> and
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>;
#  and they lived at the bottom of a well.</p>
```

The `match()` method returns a boolean depending on whether or not a specific Tag matches a selector:

```python
# elsie.css.match("#link1")
True

# elsie.css.match("#link2")
False
```

The `filter()` method returns the subset of a tag’s direct children that match a selector:

```python
[tag.string for tag in soup.find('p', 'story').css.filter('a')]
# ['Elsie', 'Lacie', 'Tillie']
```

The `escape()` method escapes CSS identifiers that would otherwise be invalid:

```python
soup.css.escape("1-strange-identifier")
# '\\31 -strange-identifier'
```

### Namespaces in CSS selectors

If you’ve parsed XML that defines namespaces, you can use them in CSS selectors.:

```python
from bs4 import BeautifulSoup
xml = """<tag xmlns:ns1="http://namespace1/" xmlns:ns2="http://namespace2/">
 <ns1:child>I'm in namespace 1</ns1:child>
 <ns2:child>I'm in namespace 2</ns2:child>
</tag> """
namespace_soup = BeautifulSoup(xml, "xml")

namespace_soup.css.select("child")
# [<ns1:child>I'm in namespace 1</ns1:child>, <ns2:child>I'm in namespace 2</ns2:child>]

namespace_soup.css.select("ns1|child")
# [<ns1:child>I'm in namespace 1</ns1:child>]
```

Beautiful Soup tries to use namespace prefixes that make sense based on what it saw while parsing the document, but you can always provide your own dictionary of abbreviations:

```python
namespaces = dict(first="http://namespace1/", second="http://namespace2/")
namespace_soup.css.select("second|child", namespaces=namespaces)
# [<ns1:child>I'm in namespace 2</ns1:child>]
```

### History of CSS selector support

The `.css` property was added in Beautiful Soup 4.12.0. Prior to this, only the `.select()` and `.select_one()` convenience methods were supported.

The Soup Sieve integration was added in Beautiful Soup 4.7.0. Earlier versions had the `.select()` method, but only the most commonly-used CSS selectors were supported.