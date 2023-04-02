---
title: Comparing objects for equality
---

Beautiful Soup says that two NavigableString or Tag objects are equal when they represent the same HTML or XML markup. In this example, the two **b** tags are treated as equal, even though they live in different parts of the object tree, because they both look like “**b**pizza **/b**”:

```python
markup = "<p>I want <b>pizza</b> and more <b>pizza</b>!</p>"
soup = BeautifulSoup(markup, 'html.parser')
first_b, second_b = soup.find_all('b')
print(first_b == second_b)
# True

print(first_b.previous_element == second_b.previous_element)
# False
```

If you want to see whether two variables refer to exactly the same object, use *is*:

```python
print(first_b is second_b)
# False
```