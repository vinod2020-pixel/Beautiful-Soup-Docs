---
title: Line Numbers
sidebar_position: 12
---

The `html.parser` and html5lib parsers can keep track of where in the original document each Tag was found. You can access this information as `Tag.sourceline` (line number) and `Tag.sourcepos` (position of the start tag within a line):

```python
markup = "<p\n>Paragraph 1</p>\n    <p>Paragraph 2</p>"
soup = BeautifulSoup(markup, 'html.parser')
for tag in soup.find_all('p'):
    print(repr((tag.sourceline, tag.sourcepos, tag.string)))
# (1, 0, 'Paragraph 1')
# (3, 4, 'Paragraph 2')
```

Note that the two parsers mean slightly different things by `sourceline` and `sourcepos`. For html.parser, these numbers represent the position of the initial less-than sign. For html5lib, these numbers represent the position of the final greater-than sign:

```python
soup = BeautifulSoup(markup, 'html5lib')
for tag in soup.find_all('p'):
    print(repr((tag.sourceline, tag.sourcepos, tag.string)))
# (2, 0, 'Paragraph 1')
# (3, 6, 'Paragraph 2')
```

You can shut off this feature by passing `store_line_numbers=False` into the BeautifulSoup constructor:

```python
markup = "<p\n>Paragraph 1</p>\n    <p>Paragraph 2</p>"
soup = BeautifulSoup(markup, 'html.parser', store_line_numbers=False)
print(soup.p.sourceline)
# None
```

*This feature is new in 4.8.1, and the parsers based on lxml don’t support it.*