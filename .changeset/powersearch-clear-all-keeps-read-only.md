---
'@astryxdesign/core': minor
---

[breaking] `PowerSearch`: Clear all keeps read-only filters. It removes only the filters the user can edit and calls `onChange` with the read-only filters and `remove` at the first removed index. The clear button shows only while an editable filter exists, Backspace on an empty input does not remove a read-only filter, and Clear all announces "Editable filters removed" while a read-only filter remains.
@imdreamrunner

Old usage:
A product that relies on Clear all, or on Backspace in the empty input, to remove filters it marked `isReadOnly: true`. A product whose `onChange` reads the `index` of a Clear all as the last filter's position: Clear all called `onChange([], 'remove', <index of the last filter>)`.

Replacement:
Clear all calls `onChange(<the read-only filters>, 'remove', <index of the first removed filter>)`. With no read-only filter, that is `onChange([], 'remove', 0)`. A read-only filter stays until your code removes it, and a field whose filters are all read-only shows no clear button.

Migration:
To let people remove read-only filters too, render your own control (for example in `endContent`) that sets your filters to `[]`, or set `isReadOnly` only on the filters people must keep. Where `onChange` uses the `index` of a `remove` that drops several filters, read it as the first removed position. Products with no `isReadOnly` filter need no change beyond that `index`.

Codemod:
None. The change is in what a press and a key do at run time; no source rewrite brings back the old result, so a codemod would be vacuous.
