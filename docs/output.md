---
title: Output
sidebar_position: 9
---

## Pretty-printing

The `prettify()` method will turn a Beautiful Soup parse tree into a nicely formatted Unicode string, with a separate line for each tag and each string:

```python
markup = '<html><head><body><a href="http://example.com/">I linked to <i>example.com</i></a>'
soup = BeautifulSoup(markup, 'html.parser')
soup.prettify()
# '<html>\n <head>\n </head>\n <body>\n  <a href="http://example.com/">\n...'

print(soup.prettify())
# <html>
#  <head>
#  </head>
#  <body>
#   <a href="http://example.com/">
#    I linked to
#    <i>
#     example.com
#    </i>
#   </a>
#  </body>
# </html>
```

You can call `prettify()` on the top-level BeautifulSoup object, or on any of its Tag objects:

```python
print(soup.a.prettify())
# <a href="http://example.com/">
#  I linked to
#  <i>
#   example.com
#  </i>
# </a>
```

Since it adds whitespace (in the form of newlines), `prettify()` changes the meaning of an HTML document and should not be used to reformat one. The goal of `prettify()` is to help you visually understand the structure of the documents you work with.

## Non-pretty printing

If you just want a string, with no fancy formatting, you can call `str()` on a BeautifulSoup object, or on a Tag within it:

```python
str(soup)
# '<html><head></head><body><a href="http://example.com/">I linked to <i>example.com</i></a></body></html>'

str(soup.a)
# '<a href="http://example.com/">I linked to <i>example.com</i></a>'
```

The `str()` function returns a string encoded in UTF-8. See Encodings for other options.

You can also call `encode()` to get a bytestring, and `decode()` to get Unicode.

## Output formatters

If you give Beautiful Soup a document that contains HTML entities like “&lquot;”, they’ll be converted to Unicode characters:

```python
soup = BeautifulSoup("&ldquo;Dammit!&rdquo; he said.", 'html.parser')
str(soup)
# '“Dammit!” he said.'
```

If you then convert the document to a bytestring, the Unicode characters will be encoded as UTF-8. You won’t get the HTML entities back:

```python
soup.encode("utf8")
# b'\xe2\x80\x9cDammit!\xe2\x80\x9d he said.'
```

By default, the only characters that are escaped upon output are bare ampersands and angle brackets. These get turned into “&amp;”, “&lt;”, and “&gt;”, so that Beautiful Soup doesn’t inadvertently generate invalid HTML or XML:

```python
soup = BeautifulSoup("<p>The law firm of Dewey, Cheatem, & Howe</p>", 'html.parser')
soup.p
# <p>The law firm of Dewey, Cheatem, &amp; Howe</p>

soup = BeautifulSoup('<a href="http://example.com/?foo=val1&bar=val2">A link</a>', 'html.parser')
soup.a
# <a href="http://example.com/?foo=val1&amp;bar=val2">A link</a>
```

You can change this behavior by providing a value for the `formatter` argument to `prettify()`, `encode()`, or `decode()`. Beautiful Soup recognizes five possible values for `formatter`.

The default is `formatter="minimal"`. Strings will only be processed enough to ensure that Beautiful Soup generates valid HTML/XML:

```python
french = "<p>Il a dit &lt;&lt;Sacr&eacute; bleu!&gt;&gt;</p>"
soup = BeautifulSoup(french, 'html.parser')
print(soup.prettify(formatter="minimal"))
# <p>
#  Il a dit &lt;&lt;Sacré bleu!&gt;&gt;
# </p>
```

If you pass in `formatter="html"`, Beautiful Soup will convert Unicode characters to HTML entities whenever possible:

```python
print(soup.prettify(formatter="html"))
# <p>
#  Il a dit &lt;&lt;Sacr&eacute; bleu!&gt;&gt;
# </p>
```

If you pass in `formatter="html5"`, it’s similar to `formatter="html"`, but Beautiful Soup will omit the closing slash in HTML void tags like “br”:

```python
br = BeautifulSoup("<br>", 'html.parser').br

print(br.encode(formatter="html"))
# b'<br/>'

print(br.encode(formatter="html5"))
# b'<br>'
```

In addition, any attributes whose values are the empty string will become HTML-style boolean attributes:

```python
option = BeautifulSoup('<option selected=""></option>').option
print(option.encode(formatter="html"))
# b'<option selected=""></option>'

print(option.encode(formatter="html5"))
# b'<option selected></option>'
```

*(This behavior is new as of Beautiful Soup 4.10.0.)*

If you pass in `formatter=None`, Beautiful Soup will not modify strings at all on output. This is the fastest option, but it may lead to Beautiful Soup generating invalid HTML/XML, as in these examples:

```python
print(soup.prettify(formatter=None))
# <p>
#  Il a dit <<Sacré bleu!>>
# </p>

link_soup = BeautifulSoup('<a href="http://example.com/?foo=val1&bar=val2">A link</a>', 'html.parser')
print(link_soup.a.encode(formatter=None))
# b'<a href="http://example.com/?foo=val1&bar=val2">A link</a>'
```

## Formatter objects

If you need more sophisticated control over your output, you can instantiate one of Beautiful Soup’s formatter classes and pass that object in as `formatter`.

class bs4.**HTMLFormatter**

Used to customize the formatting rules for HTML documents.

Here’s a formatter that converts strings to uppercase, whether they occur in a text node or in an attribute value:

```python
from bs4.formatter import HTMLFormatter
def uppercase(str):
    return str.upper()

formatter = HTMLFormatter(uppercase)

print(soup.prettify(formatter=formatter))
# <p>
#  IL A DIT <<SACRÉ BLEU!>>
# </p>

print(link_soup.a.prettify(formatter=formatter))
# <a href="HTTP://EXAMPLE.COM/?FOO=VAL1&BAR=VAL2">
#  A LINK
# </a>
```

Here’s a formatter that increases the indentation when pretty-printing:

```python
formatter = HTMLFormatter(indent=8)
print(link_soup.a.prettify(formatter=formatter))
# <a href="http://example.com/?foo=val1&bar=val2">
#         A link
# </a>
```

class bs4.**XMLFormatter**

Used to customize the formatting rules for XML documents.

## Writing your own formatter

Subclassing HTMLFormatter or XMLFormatter will give you even more control over the output. For example, Beautiful Soup sorts the attributes in every tag by default:

```python
attr_soup = BeautifulSoup(b'<p z="1" m="2" a="3"></p>', 'html.parser')
print(attr_soup.p.encode())
# <p a="3" m="2" z="1"></p>
```

To turn this off, you can subclass the `Formatter.attributes()` method, which controls which attributes are output and in what order. This implementation also filters out the attribute called “m” whenever it appears:

```python
class UnsortedAttributes(HTMLFormatter):
    def attributes(self, tag):
        for k, v in tag.attrs.items():
            if k == 'm':
                continue
            yield k, v

print(attr_soup.p.encode(formatter=UnsortedAttributes()))
# <p z="1" a="3"></p>
```

One last caveat: if you create a CData object, the text inside that object is always presented `exactly as it appears, with no formatting`. Beautiful Soup will call your entity substitution function, just in case you’ve written a custom function that counts all the strings in the document or something, but it will ignore the return value:

```python
from bs4.element import CData
soup = BeautifulSoup("<a></a>", 'html.parser')
soup.a.string = CData("one < three")
print(soup.a.prettify(formatter="html"))
# <a>
#  <![CDATA[one < three]]>
# </a>
```

## get_text()

If you only want the human-readable text inside a document or tag, you can use the `get_text()` method. It returns all the text in a document or beneath a tag, as a single Unicode string:

```python
markup = '<a href="http://example.com/">\nI linked to <i>example.com</i>\n</a>'
soup = BeautifulSoup(markup, 'html.parser')

soup.get_text()
'\nI linked to example.com\n'
soup.i.get_text()
'example.com'
```

You can specify a string to be used to join the bits of text together:

```python
# soup.get_text("|")
'\nI linked to |example.com|\n'
```

You can tell Beautiful Soup to strip whitespace from the beginning and end of each bit of text:

```python
# soup.get_text("|", strip=True)
'I linked to|example.com'
```

But at that point you might want to use the .stripped_strings generator instead, and process the text yourself:

```python
[text for text in soup.stripped_strings]
# ['I linked to', 'example.com']
```

*As of Beautiful Soup version 4.9.0, when lxml or html.parser are in use, the contents of **script**, **style**, and **template** tags are generally not considered to be ‘text’, since those tags are not part of the human-visible content of the page.*

*As of Beautiful Soup version 4.10.0, you can call get_text(), .strings, or .stripped_strings on a NavigableString object. It will either return the object itself, or nothing, so the only reason to do this is when you’re iterating over a mixed list.*