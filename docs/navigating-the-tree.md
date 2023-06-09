---
title: Navigating the Tree
sidebar_position: 6
---

Here’s the “Three sisters” HTML document again:

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

I’ll use this as an example to show you how to move from one part of a document to another.

## Going down

Tags may contain strings and other tags. These elements are the tag’s children. Beautiful Soup provides a lot of different attributes for navigating and iterating over a tag’s children.

Note that Beautiful Soup strings don’t support any of these attributes, because a string can’t have children.

### Navigating using tag names

The simplest way to navigate the parse tree is to say the name of the tag you want. If you want the **head** tag, just say `soup.head`:

```python
soup.head
# <head><title>The Dormouse's story</title></head>

soup.title
# <title>The Dormouse's story</title>
```

You can do use this trick again and again to zoom in on a certain part of the parse tree. This code gets the first **b** tag beneath the **body** tag:

```python
soup.body.b
# <b>The Dormouse's story</b>
```

Using a tag name as an attribute will give you only the first tag by that name:

```python
soup.a
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>
```

If you need to get all the **a** tags, or anything more complicated than the first tag with a certain name, you’ll need to use one of the methods described in Searching the tree, such as *find_all()*:

```python
soup.find_all('a')
# [<a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>,
#  <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>,
#  <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>]
```

### .contents and .children

A tag’s children are available in a list called `.contents`:

```python
head_tag = soup.head
head_tag
# <head><title>The Dormouse's story</title></head>

head_tag.contents
# [<title>The Dormouse's story</title>]

title_tag = head_tag.contents[0]
title_tag
# <title>The Dormouse's story</title>
title_tag.contents
# ['The Dormouse's story']
```

The `BeautifulSoup` object itself has children. In this case, the **html** tag is the child of the `BeautifulSoup` object.:

```python
len(soup.contents)
# 1
soup.contents[0].name
# 'html'
```

A string does not have `.contents`, because it can’t contain anything:

```python
text = title_tag.contents[0]
text.contents
# AttributeError: 'NavigableString' object has no attribute 'contents'
```

Instead of getting them as a list, you can iterate over a tag’s children using the `.children` generator:

```python
for child in title_tag.children:
    print(child)
# The Dormouse's story
```

If you want to modify a tag’s children, use the methods described in Modifying the tree. Don’t modify the the `.contents` list directly: that can lead to problems that are subtle and difficult to spot.

### .descendants

The `.contents` and `.children` attributes only consider a tag’s direct children. For instance, the **head** tag has a single direct child–the **title** tag:

```python
head_tag.contents
# [<title>The Dormouse's story</title>]
```

But the **title** tag itself has a child: the string “The Dormouse’s story”. There’s a sense in which that string is also a child of the **head** tag. The `.descendants` attribute lets you iterate over all of a tag’s children, recursively: its direct children, the children of its direct children, and so on:

```python
for child in head_tag.descendants:
    print(child)
# <title>The Dormouse's story</title>
# The Dormouse's story
```

The **head** tag has only one child, but it has two descendants: the **title** tag and the **title** tag’s child. The BeautifulSoup object only has one direct child (the **html** tag), but it has a whole lot of descendants:

```python
len(list(soup.children))
# 1
len(list(soup.descendants))
# 26
```

### .string

If a tag has only one child, and that child is a NavigableString, the child is made available as `.string`:

```python
title_tag.string
# 'The Dormouse's story'
```

If a tag’s only child is another tag, and that tag has a `.string`, then the parent tag is considered to have the same `.string` as its child:

```python
head_tag.contents
# [<title>The Dormouse's story</title>]

head_tag.string
# 'The Dormouse's story'
```

If a tag contains more than one thing, then it’s not clear what `.string` should refer to, so `.string` is defined to be `None`:

```python
print(soup.html.string)
# None
```

### .strings and stripped_strings

If there’s more than one thing inside a tag, you can still look at just the strings. Use the `.strings` generator:

```python
for string in soup.strings:
    print(repr(string))
    '\n'
# "The Dormouse's story"
# '\n'
# '\n'
# "The Dormouse's story"
# '\n'
# 'Once upon a time there were three little sisters; and their names were\n'
# 'Elsie'
# ',\n'
# 'Lacie'
# ' and\n'
# 'Tillie'
# ';\nand they lived at the bottom of a well.'
# '\n'
# '...'
# '\n'
```

These strings tend to have a lot of extra whitespace, which you can remove by using the `.stripped_strings` generator instead:

```python
for string in soup.stripped_strings:
    print(repr(string))
# "The Dormouse's story"
# "The Dormouse's story"
# 'Once upon a time there were three little sisters; and their names were'
# 'Elsie'
# ','
# 'Lacie'
# 'and'
# 'Tillie'
# ';\n and they lived at the bottom of a well.'
# '...'
```

Here, strings consisting entirely of whitespace are ignored, and whitespace at the beginning and end of strings is removed.

## Going up

Continuing the “family tree” analogy, every tag and every string has a *parent*: the tag that contains it.

### .parent

You can access an element’s parent with the `.parent` attribute. In the example “three sisters” document, the **head** tag is the parent of the **title** tag:

```python
title_tag = soup.title
title_tag
# <title>The Dormouse's story</title>
title_tag.parent
# <head><title>The Dormouse's story</title></head>
```

The title string itself has a parent: the **title** tag that contains it:

```python
title_tag.string.parent
# <title>The Dormouse's story</title>
```

The parent of a top-level tag like **html** is the BeautifulSoup object itself:

```python
html_tag = soup.html
type(html_tag.parent)
# <class 'bs4.BeautifulSoup'>
```

And the `.parent` of a BeautifulSoup object is defined as None:

```python
print(soup.parent)
# None
```

### .parents

You can iterate over all of an element’s parents with `.parents`. This example uses `.parents` to travel from an **a** tag buried deep within the document, to the very top of the document:

```python
link = soup.a
link
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>
for parent in link.parents:
    print(parent.name)
# p
# body
# html
# [document]
```

## Going sideways

Consider a simple document like this:

```python
sibling_soup = BeautifulSoup("<a><b>text1</b><c>text2</c></a>", 'html.parser')
print(sibling_soup.prettify())
#   <a>
#    <b>
#     text1
#    </b>
#    <c>
#     text2
#    </c>
#   </a>
```

The **b** tag and the **c** tag are at the same level: they’re both direct children of the same tag. We call them *siblings*. When a document is pretty-printed, siblings show up at the same indentation level. You can also use this relationship in the code you write.

### .next_sibling and .previous_sibling

You can use `.next_sibling` and `.previous_sibling` to navigate between page elements that are on the same level of the parse tree:

```python
sibling_soup.b.next_sibling
# <c>text2</c>

sibling_soup.c.previous_sibling
# <b>text1</b>
```

The **b** tag has a `.next_sibling`, but no `.previous_sibling`, because there’s nothing before the **b** tag *on the same level of the tree*. For the same reason, the **c** tag has a `.previous_sibling` but no `.next_sibling`:

```python
print(sibling_soup.b.previous_sibling)
# None
print(sibling_soup.c.next_sibling)
# None
```

The strings “text1” and “text2” are not siblings, because they don’t have the same parent:

```python
sibling_soup.b.string
# 'text1'

print(sibling_soup.b.string.next_sibling)
# None
```

In real documents, the `.next_sibling` or `.previous_sibling` of a tag will usually be a string containing whitespace. Going back to the “three sisters” document:

```python
# <a href="http://example.com/elsie" class="sister" id="link1">Elsie</a>,
# <a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
# <a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
```

You might think that the `.next_sibling` of the first **a** tag would be the second **a** tag. But actually, it’s a string: the comma and newline that separate the first **a** tag from the second:

```python
link = soup.a
link
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>

link.next_sibling
# ',\n '
```

The second **a** tag is actually the `.next_sibling` of the comma:

```python
link.next_sibling.next_sibling
# <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>
```

### .next_siblings and .previous_siblings

You can iterate over a tag’s siblings with `.next_siblings` or `.previous_siblings`:

```python
for sibling in soup.a.next_siblings:
    print(repr(sibling))
# ',\n'
# <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>
# ' and\n'
# <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>
# '; and they lived at the bottom of a well.'

for sibling in soup.find(id="link3").previous_siblings:
    print(repr(sibling))
# ' and\n'
# <a class="sister" href="http://example.com/lacie" id="link2">Lacie</a>
# ',\n'
# <a class="sister" href="http://example.com/elsie" id="link1">Elsie</a>
# 'Once upon a time there were three little sisters; and their names were\n'
```

## Going back and forth

Take a look at the beginning of the “three sisters” document:

```python
# <html><head><title>The Dormouse's story</title></head>
# <p class="title"><b>The Dormouse's story</b></p>
```

An HTML parser takes this string of characters and turns it into a series of events: “open an **html** tag”, “open a **head** tag”, “open a **title** tag”, “add a string”, “close the **title** tag”, “open a **p** tag”, and so on. Beautiful Soup offers tools for reconstructing the initial parse of the document.

### .next_element and .previous_element

The `.next_element` attribute of a string or tag points to whatever was parsed immediately afterwards. It might be the same as `.next_sibling`, but it’s usually drastically different.

Here’s the final **a** tag in the “three sisters” document. Its `.next_sibling` is a string: the conclusion of the sentence that was interrupted by the start of the **a** tag.:

```python
last_a_tag = soup.find("a", id="link3")
last_a_tag
# <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>

last_a_tag.next_sibling
# ';\nand they lived at the bottom of a well.'
```

But the .next_element of that **a** tag, the thing that was parsed immediately after the **a** tag, is not the rest of that sentence: it’s the word “Tillie”:

```python
last_a_tag.next_element
# 'Tillie'
```

That’s because in the original markup, the word “Tillie” appeared before that semicolon. The parser encountered an **a** tag, then the word “Tillie”, then the closing **\a** tag, then the semicolon and rest of the sentence. The semicolon is on the same level as the **a** tag, but the word “Tillie” was encountered first.

The `.previous_element` attribute is the exact opposite of `.next_element`. It points to whatever element was parsed immediately before this one:

```python
last_a_tag.previous_element
# ' and\n'
last_a_tag.previous_element.next_element
# <a class="sister" href="http://example.com/tillie" id="link3">Tillie</a>
```

### .next_elements and .previous_elements

You should get the idea by now. You can use these iterators to move forward or backward in the document as it was parsed:

```python
for element in last_a_tag.next_elements:
    print(repr(element))
# 'Tillie'
# ';\nand they lived at the bottom of a well.'
# '\n'
# <p class="story">...</p>
# '...'
# '\n'
```