---
title: Copying Beautiful Soup Objects
sidebar_position: 14
---

You can use `copy.copy()` to create a copy of any `Tag` or `NavigableString`:

```python
import copy
p_copy = copy.copy(soup.p)
print p_copy
# <p>I want <b>pizza</b> and more <b>pizza</b>!</p>
```

The copy is considered equal to the original, since it represents the same markup as the original, but it’s not the same object:

```python
print soup.p == p_copy
# True

print soup.p is p_copy
# False
```

The only real difference is that the copy is completely detached from the original Beautiful Soup object tree, just as if `extract()` had been called on it:

```python
print p_copy.parent
# None
```

This is because two different `Tag` objects can’t occupy the same space at the same time.