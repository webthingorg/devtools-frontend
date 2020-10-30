# data-grid

The data-grid component takes in tabular data and renders it into a table. It does not provide complex functionality such as sorting or filtering. For that, you should use a `data-grid-controller` component.

## Passing data into the data grid

The data-grid takes in `rows` and `columns` separately.

### Columns

A column is an object with the following properties:

- `id`: a unique ID for that column.
- `title`: the user visible title.
- `hidden`: an optional flag to mark the column as hidden, so it won't render.
- `width`: a number that denotes the width of the column. This is percentage based, out of 100.
- `sortable`: an optional property to denote if the column is sortable. Note, if
  you're rendering a data-grid yourself you likely shouldn't set this. It's set
  by the `data-grid-controller`, which is the component you want if your table
  needs to be sortable.

### Rows

A row is an object with the following properties:

- `cells`: this is an array of cells for that row. See below for the structure
  of a `cell`.
- `hidden`: an optional flag to mark the row as hidden, so it won't render.

Each row will contain a list of cells. Each cell contains two properties:

- `columnId`: this is the ID of the column that the cell represents.
- `value`: the string value of the cell. Note that currently cell values _must_
  be strings. In the future we will expand to support other values or custom
  HTML within the cells. Ping jacktfranklin@ if you have a use case in mind.

For example, to construct a table of capital cities around the world, we
might pass in:

```js
const columns = [
  { id: 'city', title: 'City', width: 50 },
  { id: 'country', title: 'Country', width: 50 },
]

const rows = [
  { cells: [{ columnId: 'city', value: 'London' }, { columnId: 'country', value: 'UK' }]},
  { cells: [{ columnId: 'city', value: 'Berlin' }, { columnId: 'country', value: 'Germany' }]},
]
```

# data-grid-controller

A data-grid-controller extends the basic data-grid with more
functionality. It renders a regular data-grid, but contains logic for
filtering and sorting columns.

You create a data-grid-controller in the same way as you create a
data-grid, and the structure of the `rows` and `columns` is identical.
Any column you wish to be sortable should have `sortable: true` set.
Currently colums are sorted alphabetically in ASC or DESC order. We do
not yet have the ability to provide custom compartor functions for
column sorting.

A data-grid-controller can optionally also take `filterText`. This is a
string that will be used to filter rows. Any row with any value that
matches the given text will be visible, and the rest hidden. Note that
this does not support regular expressions, or matching via
`columnTitle:value` as some parts of DevTools currently do. This
functionality will be expanded over time as required.

