package util

type Set[T comparable] struct {
	items map[T]struct{}
}

func NewSet[T comparable]() *Set[T] {
	return &Set[T]{items: make(map[T]struct{})}
}

func NewSetFromSlice[T comparable](slice []T) *Set[T] {
	set := NewSet[T]()
	for _, item := range slice {
		set.Add(item)
	}
	return set
}

func (s *Set[T]) Add(item T) {
	s.items[item] = struct{}{}
}

func (s *Set[T]) Delete(item T) {
	delete(s.items, item)
}

func (s *Set[T]) Contains(item T) bool {
	_, exists := s.items[item]
	return exists
}

func (s *Set[T]) Size() int {
	return len(s.items)
}

func (s *Set[T]) IsEmpty() bool {
	return s.Size() == 0
}

func (s *Set[T]) GenerateIntersectionWith(os *Set[T]) *Set[T] {
	intersection := NewSet[T]()
	if s.Size() > os.Size() {
		for item := range os.items {
			if s.Contains(item) {
				intersection.Add(item)
			}
		}
	} else {
		for item := range s.items {
			if os.Contains(item) {
				intersection.Add(item)
			}
		}
	}
	return intersection
}

func (s *Set[T]) HasIntersectionWith(os *Set[T]) bool {
	if s.Size() > os.Size() {
		for item := range os.items {
			if s.Contains(item) {
				return true
			}
		}
	} else {
		for item := range s.items {
			if os.Contains(item) {
				return true
			}
		}
	}
	return false
}

func (s *Set[T]) GenerateUnionWith(os *Set[T]) *Set[T] {
	union := NewSet[T]()
	for item := range s.items {
		union.Add(item)
	}
	for item := range os.items {
		union.Add(item)
	}
	return union
}

func (s *Set[T]) GenerateDifferenceWith(os *Set[T]) *Set[T] {
	difference := NewSet[T]()
	for item := range s.items {
		if !os.Contains(item) {
			difference.Add(item)
		}
	}
	return difference
}

func (s *Set[T]) ToSlice() []T {
	slice := make([]T, 0, s.Size())
	for item, _ := range s.items {
		slice = append(slice, item)
	}
	return slice
}
