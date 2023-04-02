---
title: Modifying the Tree
---

Beautiful Soup’s main strength is in searching the parse tree, but you can also modify the tree and write your changes as a new HTML or XML document.

## Changing tag names and attributes

I covered this earlier, in Tag.attrs, but it bears repeating. You can rename a tag, change the values of its attributes, add new attributes, and delete attributes:

```python
soup = BeautifulSoup('<b class="boldest">Extremely bold</b>', 'html.parser')
tag = soup.b

tag.name = "blockquote"
tag['class'] = 'verybold'
tag['id'] = 1
tag
# <blockquote class="verybold" id="1">Extremely bold</blockquote>

del tag['class']
del tag['id']
tag
# <blockquote>Extremely bold</blockquote>
```

## Modifying .string

If you set a tag’s `.string` attribute to a new string, the tag’s contents are replaced with that string:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')

tag = soup.a
tag.string = "New link text."
tag
# <a href="http://example.com/">New link text.</a>
```

:::caution

if the tag contained other tags, they and all their contents will be destroyed.

:::

## append()

You can add to a tag’s contents with `Tag.append()`. It works just like calling `.append()` on a Python list:

```python
soup = BeautifulSoup("<a>Foo</a>", 'html.parser')
soup.a.append("Bar")

soup
# <a>FooBar</a>
soup.a.contents
# ['Foo', 'Bar']
```

## extend()

Starting in Beautiful Soup 4.7.0, Tag also supports a method called `.extend()`, which adds every element of a list to a Tag, in order:

```python
soup = BeautifulSoup("<a>Soup</a>", 'html.parser')
soup.a.extend(["'s", " ", "on"])

soup
# <a>Soup's on</a>
soup.a.contents
# ['Soup', ''s', ' ', 'on']
```

## NavigableString() and .new_tag()

If you need to add a string to a document, no problem–you can pass a Python string in to `append()`, or you can call the NavigableString constructor:

```python
from bs4 import NavigableString
soup = BeautifulSoup("<b></b>", 'html.parser')
tag = soup.b
tag.append("Hello")
new_string = NavigableString(" there")
tag.append(new_string)
tag
# <b>Hello there.</b>
tag.contents
# ['Hello', ' there']
```

If you want to create a comment or some other subclass of NavigableString, just call the constructor:

```python
from bs4 import Comment
new_comment = Comment("Nice to see you.")
tag.append(new_comment)
tag
# <b>Hello there<!--Nice to see you.--></b>
tag.contents
# ['Hello', ' there', 'Nice to see you.']
```

*(This is a new feature in Beautiful Soup 4.4.0.)*

What if you need to create a whole new tag? The best solution is to call the factory method `BeautifulSoup.new_tag()`:

```python
soup = BeautifulSoup("<b></b>", 'html.parser')
original_tag = soup.b

new_tag = soup.new_tag("a", href="http://www.example.com")
original_tag.append(new_tag)
original_tag
# <b><a href="http://www.example.com"></a></b>

new_tag.string = "Link text."
original_tag
# <b><a href="http://www.example.com">Link text.</a></b>
```

Only the first argument, the tag name, is required.

## insert()

`Tag.insert()` is just like `Tag.append()`, except the new element doesn’t necessarily go at the end of its parent’s `.contents`. It’ll be inserted at whatever numeric position you say. It works just like `.insert()` on a Python list:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
tag = soup.a

tag.insert(1, "but did not endorse ")
tag
# <a href="http://example.com/">I linked to but did not endorse <i>example.com</i></a>
tag.contents
# ['I linked to ', 'but did not endorse', <i>example.com</i>]
```

## insert_before() and insert_after()

The `insert_before()` method inserts tags or strings immediately before something else in the parse tree:

```python
soup = BeautifulSoup("<b>leave</b>", 'html.parser')
tag = soup.new_tag("i")
tag.string = "Don't"
soup.b.string.insert_before(tag)
soup.b
# <b><i>Don't</i>leave</b>
```

The `insert_after()` method inserts tags or strings immediately following something else in the parse tree:

```python
div = soup.new_tag('div')
div.string = 'ever'
soup.b.i.insert_after(" you ", div)
soup.b
# <b><i>Don't</i> you <div>ever</div> leave</b>
soup.b.contents
# [<i>Don't</i>, ' you', <div>ever</div>, 'leave']
```

## clear()

`Tag.clear()` removes the contents of a tag:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
tag = soup.a

tag.clear()
tag
# <a href="http://example.com/"></a>
```

## extract()

`PageElement.extract()` removes a tag or string from the tree. It returns the tag or string that was extracted:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
a_tag = soup.a

i_tag = soup.i.extract()

a_tag
# <a href="http://example.com/">I linked to</a>

i_tag
# <i>example.com</i>

print(i_tag.parent)
# None
```

At this point you effectively have two parse trees: one rooted at the BeautifulSoup object you used to parse the document, and one rooted at the tag that was extracted. You can go on to call `extract` on a child of the element you extracted:

```python
my_string = i_tag.string.extract()
my_string
# 'example.com'

print(my_string.parent)
# None
i_tag
# <i></i>
```

## decompose()

`Tag.decompose()` removes a tag from the tree, then *completely destroys it and its contents*:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
a_tag = soup.a
i_tag = soup.i

i_tag.decompose()
a_tag
# <a href="http://example.com/">I linked to</a>
```

The behavior of a decomposed Tag or NavigableString is not defined and you should not use it for anything. If you’re not sure whether something has been decomposed, you can check its `.decomposed` property *(new in Beautiful Soup 4.9.0)*:

```python
i_tag.decomposed
# True

a_tag.decomposed
# False
```

## replace_with()

`PageElement.replace_with()` removes a tag or string from the tree, and replaces it with one or more tags or strings of your choice:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
a_tag = soup.a

new_tag = soup.new_tag("b")
new_tag.string = "example.com"
a_tag.i.replace_with(new_tag)

a_tag
# <a href="http://example.com/">I linked to <b>example.com</b></a>

bold_tag = soup.new_tag("b")
bold_tag.string = "example"
i_tag = soup.new_tag("i")
i_tag.string = "net"
a_tag.b.replace_with(bold_tag, ".", i_tag)

a_tag
# <a href="http://example.com/">I linked to <b>example</b>.<i>net</i></a>
```

`replace_with()` returns the tag or string that got replaced, so that you can examine it or add it back to another part of the tree.

*The ability to pass multiple arguments into replace_with() is new in Beautiful Soup 4.10.0.*

## wrap()

`PageElement.wrap()` wraps an element in the tag you specify. It returns the new wrapper:

```python
soup = BeautifulSoup("<p>I wish I was bold.</p>", 'html.parser')
soup.p.string.wrap(soup.new_tag("b"))
# <b>I wish I was bold.</b>

soup.p.wrap(soup.new_tag("div"))
# <div><p><b>I wish I was bold.</b></p></div>
```

*This method is new in Beautiful Soup 4.0.5.*

## unwrap()

`Tag.unwrap()` is the opposite of `wrap()`. It replaces a tag with whatever’s inside that tag. It’s good for stripping out markup:

```python
markup = '<a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
a_tag = soup.a

a_tag.i.unwrap()
a_tag
# <a href="http://example.com/">I linked to example.com</a>
```

Like `replace_with()`, `unwrap()` returns the tag that was replaced.

## smooth()

After calling a bunch of methods that modify the parse tree, you may end up with two or more NavigableString objects next to each other. Beautiful Soup doesn’t have any problems with this, but since it can’t happen in a freshly parsed document, you might not expect behavior like the following:

```python
soup = BeautifulSoup("<p>A one</p>", 'html.parser')
soup.p.append(", a two")

soup.p.contents
# ['A one', ', a two']

print(soup.p.encode())
# b'<p>A one, a two</p>'

print(soup.p.prettify())
# <p>
#  A one
#  , a two
# </p>
```

You can call `Tag.smooth()` to clean up the parse tree by consolidating adjacent strings:

```python
soup.smooth()

soup.p.contents
# ['A one, a two']

print(soup.p.prettify())
# <p>
#  A one, a two
# </p>
```

*This method is new in Beautiful Soup 4.8.0.*