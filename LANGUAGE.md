# Architecture Language

This file defines the vocabulary used in architecture discussions and code review. Consistent language is the point — use these terms exactly, not drift synonyms.

## Core terms

**Module**
Anything with an interface and an implementation. Can be a function, a class, a package, or a vertical slice.

**Interface**
Everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature — the full contract.

**Implementation**
The code inside the module. What happens when you call the interface.

**Depth**
The leverage a module provides: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.

**Seam**
Where an interface lives. A place behaviour can be altered without editing in place.

**Adapter**
A concrete thing satisfying an interface at a seam.

**Leverage**
What callers get from depth. More behaviour per unit of interface.

**Locality**
What maintainers get from depth. Change, bugs, and knowledge concentrated in one place rather than spread across N callers.

## Key principles

**Deletion test**
Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.

**The interface is the test surface**
Tests verify the interface contract. If you can't write meaningful tests against the interface, the seam is wrong.

**One adapter = hypothetical seam; two adapters = real seam**
A single implementation behind an interface is just indirection. A second concrete adapter proves the seam is real.
