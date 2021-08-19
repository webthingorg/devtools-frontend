/**
A text iterator iterates over a sequence of strings. When
iterating over a [`Text`](https://codemirror.net/6/docs/ref/#text.Text) document, result values will
either be lines or line breaks.
*/
interface TextIterator extends Iterator<string> {
    /**
    Retrieve the next string. Optionally skip a given number of
    positions after the current position. Always returns the object
    itself.
    */
    next(skip?: number): this;
    /**
    The current string. Will be the empty string when the cursor is
    at its end or `next` hasn't been called on it yet.
    */
    value: string;
    /**
    Whether the end of the iteration has been reached. You should
    probably check this right after calling `next`.
    */
    done: boolean;
    /**
    Whether the current string represents a line break.
    */
    lineBreak: boolean;
}
/**
The data structure for documents.
*/
declare abstract class Text implements Iterable<string> {
    /**
    The length of the string.
    */
    abstract readonly length: number;
    /**
    The number of lines in the string (always >= 1).
    */
    abstract readonly lines: number;
    [Symbol.iterator]: () => Iterator<string>;
    /**
    Get the line description around the given position.
    */
    lineAt(pos: number): Line;
    /**
    Get the description for the given (1-based) line number.
    */
    line(n: number): Line;
    /**
    Replace a range of the text with the given content.
    */
    replace(from: number, to: number, text: Text): Text;
    /**
    Append another document to this one.
    */
    append(other: Text): Text;
    /**
    Retrieve the text between the given points.
    */
    slice(from: number, to?: number): Text;
    /**
    Retrive a part of the document as a string
    */
    abstract sliceString(from: number, to?: number, lineSep?: string): string;
    /**
    Test whether this text is equal to another instance.
    */
    eq(other: Text): boolean;
    /**
    Iterate over the text. When `dir` is `-1`, iteration happens
    from end to start. This will return lines and the breaks between
    them as separate strings, and for long lines, might split lines
    themselves into multiple chunks as well.
    */
    iter(dir?: 1 | -1): TextIterator;
    /**
    Iterate over a range of the text. When `from` > `to`, the
    iterator will run in reverse.
    */
    iterRange(from: number, to?: number): TextIterator;
    /**
    Convert the document to an array of lines (which can be
    deserialized again via [`Text.of`](https://codemirror.net/6/docs/ref/#text.Text^of)).
    */
    toJSON(): string[];
    /**
    Create a `Text` instance for the given array of lines.
    */
    static of(text: readonly string[]): Text;
    /**
    The empty document.
    */
    static empty: Text;
}
/**
This type describes a line in the document. It is created
on-demand when lines are [queried](https://codemirror.net/6/docs/ref/#text.Text.lineAt).
*/
declare class Line {
    /**
    The position of the start of the line.
    */
    readonly from: number;
    /**
    The position at the end of the line (_before_ the line break,
    or at the end of document for the last line).
    */
    readonly to: number;
    /**
    This line's line number (1-based).
    */
    readonly number: number;
    /**
    The line's content.
    */
    readonly text: string;
    /**
    The length of the line (not including any line break after it).
    */
    get length(): number;
}

/**
Distinguishes different ways in which positions can be mapped.
*/
declare enum MapMode {
    /**
    Map a position to a valid new position, even when its context
    was deleted.
    */
    Simple = 0,
    /**
    Return null if deletion happens across the position.
    */
    TrackDel = 1,
    /**
    Return null if the character _before_ the position is deleted.
    */
    TrackBefore = 2,
    /**
    Return null if the character _after_ the position is deleted.
    */
    TrackAfter = 3
}
/**
A change description is a variant of [change set](https://codemirror.net/6/docs/ref/#state.ChangeSet)
that doesn't store the inserted text. As such, it can't be
applied, but is cheaper to store and manipulate.
*/
declare class ChangeDesc {
    /**
    The length of the document before the change.
    */
    get length(): number;
    /**
    The length of the document after the change.
    */
    get newLength(): number;
    /**
    False when there are actual changes in this set.
    */
    get empty(): boolean;
    /**
    Iterate over the unchanged parts left by these changes.
    */
    iterGaps(f: (posA: number, posB: number, length: number) => void): void;
    /**
    Iterate over the ranges changed by these changes. (See
    [`ChangeSet.iterChanges`](https://codemirror.net/6/docs/ref/#state.ChangeSet.iterChanges) for a
    variant that also provides you with the inserted text.)

    When `individual` is true, adjacent changes (which are kept
    separate for [position mapping](https://codemirror.net/6/docs/ref/#state.ChangeDesc.mapPos)) are
    reported separately.
    */
    iterChangedRanges(f: (fromA: number, toA: number, fromB: number, toB: number) => void, individual?: boolean): void;
    /**
    Get a description of the inverted form of these changes.
    */
    get invertedDesc(): ChangeDesc;
    /**
    Compute the combined effect of applying another set of changes
    after this one. The length of the document after this set should
    match the length before `other`.
    */
    composeDesc(other: ChangeDesc): ChangeDesc;
    /**
    Map this description, which should start with the same document
    as `other`, over another set of changes, so that it can be
    applied after it. When `before` is true, map as if the changes
    in `other` happened before the ones in `this`.
    */
    mapDesc(other: ChangeDesc, before?: boolean): ChangeDesc;
    /**
    Map a given position through these changes, to produce a
    position pointing into the new document.

    `assoc` indicates which side the position should be associated
    with. When it is negative or zero, the mapping will try to keep
    the position close to the character before it (if any), and will
    move it before insertions at that point or replacements across
    that point. When it is positive, the position is associated with
    the character after it, and will be moved forward for insertions
    at or replacements across the position. Defaults to -1.

    `mode` determines whether deletions should be
    [reported](https://codemirror.net/6/docs/ref/#state.MapMode). It defaults to
    [`MapMode.Simple`](https://codemirror.net/6/docs/ref/#state.MapMode.Simple) (don't report
    deletions).
    */
    mapPos(pos: number, assoc?: number): number;
    mapPos(pos: number, assoc: number, mode: MapMode): number | null;
    /**
    Check whether these changes touch a given range. When one of the
    changes entirely covers the range, the string `"cover"` is
    returned.
    */
    touchesRange(from: number, to?: number): boolean | "cover";
    /**
    Serialize this change desc to a JSON-representable value.
    */
    toJSON(): readonly number[];
    /**
    Create a change desc from its JSON representation (as produced
    by [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeDesc.toJSON).
    */
    static fromJSON(json: any): ChangeDesc;
}
/**
This type is used as argument to
[`EditorState.changes`](https://codemirror.net/6/docs/ref/#state.EditorState.changes) and in the
[`changes` field](https://codemirror.net/6/docs/ref/#state.TransactionSpec.changes) of transaction
specs to succinctly describe document changes. It may either be a
plain object describing a change (a deletion, insertion, or
replacement, depending on which fields are present), a [change
set](https://codemirror.net/6/docs/ref/#state.ChangeSet), or an array of change specs.
*/
declare type ChangeSpec = {
    from: number;
    to?: number;
    insert?: string | Text;
} | ChangeSet | readonly ChangeSpec[];
/**
A change set represents a group of modifications to a document. It
stores the document length, and can only be applied to documents
with exactly that length.
*/
declare class ChangeSet extends ChangeDesc {
    /**
    Apply the changes to a document, returning the modified
    document.
    */
    apply(doc: Text): Text;
    mapDesc(other: ChangeDesc, before?: boolean): ChangeDesc;
    /**
    Given the document as it existed _before_ the changes, return a
    change set that represents the inverse of this set, which could
    be used to go from the document created by the changes back to
    the document as it existed before the changes.
    */
    invert(doc: Text): ChangeSet;
    /**
    Combine two subsequent change sets into a single set. `other`
    must start in the document produced by `this`. If `this` goes
    `docA` → `docB` and `other` represents `docB` → `docC`, the
    returned value will represent the change `docA` → `docC`.
    */
    compose(other: ChangeSet): ChangeSet;
    /**
    Given another change set starting in the same document, maps this
    change set over the other, producing a new change set that can be
    applied to the document produced by applying `other`. When
    `before` is `true`, order changes as if `this` comes before
    `other`, otherwise (the default) treat `other` as coming first.

    Given two changes `A` and `B`, `A.compose(B.map(A))` and
    `B.compose(A.map(B, true))` will produce the same document. This
    provides a basic form of [operational
    transformation](https://en.wikipedia.org/wiki/Operational_transformation),
    and can be used for collaborative editing.
    */
    map(other: ChangeDesc, before?: boolean): ChangeSet;
    /**
    Iterate over the changed ranges in the document, calling `f` for
    each.

    When `individual` is true, adjacent changes are reported
    separately.
    */
    iterChanges(f: (fromA: number, toA: number, fromB: number, toB: number, inserted: Text) => void, individual?: boolean): void;
    /**
    Get a [change description](https://codemirror.net/6/docs/ref/#state.ChangeDesc) for this change
    set.
    */
    get desc(): ChangeDesc;
    /**
    Serialize this change set to a JSON-representable value.
    */
    toJSON(): any;
    /**
    Create a change set for the given changes, for a document of the
    given length, using `lineSep` as line separator.
    */
    static of(changes: ChangeSpec, length: number, lineSep?: string): ChangeSet;
    /**
    Create an empty changeset of the given length.
    */
    static empty(length: number): ChangeSet;
    /**
    Create a changeset from its JSON representation (as produced by
    [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeSet.toJSON).
    */
    static fromJSON(json: any): ChangeSet;
}

/**
A single selection range. When
[`allowMultipleSelections`](https://codemirror.net/6/docs/ref/#state.EditorState^allowMultipleSelections)
is enabled, a [selection](https://codemirror.net/6/docs/ref/#state.EditorSelection) may hold
multiple ranges. By default, selections hold exactly one range.
*/
declare class SelectionRange {
    /**
    The lower boundary of the range.
    */
    readonly from: number;
    /**
    The upper boundary of the range.
    */
    readonly to: number;
    private flags;
    /**
    The anchor of the range—the side that doesn't move when you
    extend it.
    */
    get anchor(): number;
    /**
    The head of the range, which is moved when the range is
    [extended](https://codemirror.net/6/docs/ref/#state.SelectionRange.extend).
    */
    get head(): number;
    /**
    True when `anchor` and `head` are at the same position.
    */
    get empty(): boolean;
    /**
    If this is a cursor that is explicitly associated with the
    character on one of its sides, this returns the side. -1 means
    the character before its position, 1 the character after, and 0
    means no association.
    */
    get assoc(): -1 | 0 | 1;
    /**
    The bidirectional text level associated with this cursor, if
    any.
    */
    get bidiLevel(): number | null;
    /**
    The goal column (stored vertical offset) associated with a
    cursor. This is used to preserve the vertical position when
    [moving](https://codemirror.net/6/docs/ref/#view.EditorView.moveVertically) across
    lines of different length.
    */
    get goalColumn(): number | undefined;
    /**
    Map this range through a change, producing a valid range in the
    updated document.
    */
    map(change: ChangeDesc, assoc?: number): SelectionRange;
    /**
    Extend this range to cover at least `from` to `to`.
    */
    extend(from: number, to?: number): SelectionRange;
    /**
    Compare this range to another range.
    */
    eq(other: SelectionRange): boolean;
    /**
    Return a JSON-serializable object representing the range.
    */
    toJSON(): any;
    /**
    Convert a JSON representation of a range to a `SelectionRange`
    instance.
    */
    static fromJSON(json: any): SelectionRange;
}
/**
An editor selection holds one or more selection ranges.
*/
declare class EditorSelection {
    /**
    The ranges in the selection, sorted by position. Ranges cannot
    overlap (but they may touch, if they aren't empty).
    */
    readonly ranges: readonly SelectionRange[];
    /**
    The index of the _main_ range in the selection (which is
    usually the range that was added last).
    */
    readonly mainIndex: number;
    /**
    Map a selection through a change. Used to adjust the selection
    position for changes.
    */
    map(change: ChangeDesc, assoc?: number): EditorSelection;
    /**
    Compare this selection to another selection.
    */
    eq(other: EditorSelection): boolean;
    /**
    Get the primary selection range. Usually, you should make sure
    your code applies to _all_ ranges, by using methods like
    [`changeByRange`](https://codemirror.net/6/docs/ref/#state.EditorState.changeByRange).
    */
    get main(): SelectionRange;
    /**
    Make sure the selection only has one range. Returns a selection
    holding only the main range from this selection.
    */
    asSingle(): EditorSelection;
    /**
    Extend this selection with an extra range.
    */
    addRange(range: SelectionRange, main?: boolean): EditorSelection;
    /**
    Replace a given range with another range, and then normalize the
    selection to merge and sort ranges if necessary.
    */
    replaceRange(range: SelectionRange, which?: number): EditorSelection;
    /**
    Convert this selection to an object that can be serialized to
    JSON.
    */
    toJSON(): any;
    /**
    Create a selection from a JSON representation.
    */
    static fromJSON(json: any): EditorSelection;
    /**
    Create a selection holding a single range.
    */
    static single(anchor: number, head?: number): EditorSelection;
    /**
    Sort and merge the given set of ranges, creating a valid
    selection.
    */
    static create(ranges: readonly SelectionRange[], mainIndex?: number): EditorSelection;
    /**
    Create a cursor selection range at the given position. You can
    safely ignore the optional arguments in most situations.
    */
    static cursor(pos: number, assoc?: number, bidiLevel?: number, goalColumn?: number): SelectionRange;
    /**
    Create a selection range.
    */
    static range(anchor: number, head: number, goalColumn?: number): SelectionRange;
}

declare type FacetConfig<Input, Output> = {
    /**
    How to combine the input values into a single output value. When
    not given, the array of input values becomes the output. This
    will immediately be called on creating the facet, with an empty
    array, to compute the facet's default value when no inputs are
    present.
    */
    combine?: (value: readonly Input[]) => Output;
    /**
    How to compare output values to determine whether the value of
    the facet changed. Defaults to comparing by `===` or, if no
    `combine` function was given, comparing each element of the
    array with `===`.
    */
    compare?: (a: Output, b: Output) => boolean;
    /**
    How to compare input values to avoid recomputing the output
    value when no inputs changed. Defaults to comparing with `===`.
    */
    compareInput?: (a: Input, b: Input) => boolean;
    /**
    Static facets can not contain dynamic inputs.
    */
    static?: boolean;
    /**
    If given, these extension(s) will be added to any state where
    this facet is provided. (Note that, while a facet's default
    value can be read from a state even if the facet wasn't present
    in the state at all, these extensions won't be added in that
    situation.)
    */
    enables?: Extension;
};
/**
A facet is a labeled value that is associated with an editor
state. It takes inputs from any number of extensions, and combines
those into a single output value.

Examples of facets are the [theme](https://codemirror.net/6/docs/ref/#view.EditorView^theme) styles
associated with an editor or the [tab
size](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) (which is reduced to a single
value, using the input with the hightest precedence).
*/
declare class Facet<Input, Output = readonly Input[]> {
    private isStatic;
    private constructor();
    /**
    Define a new facet.
    */
    static define<Input, Output = readonly Input[]>(config?: FacetConfig<Input, Output>): Facet<Input, Output>;
    /**
    Returns an extension that adds the given value for this facet.
    */
    of(value: Input): Extension;
    /**
    Create an extension that computes a value for the facet from a
    state. You must take care to declare the parts of the state that
    this value depends on, since your function is only called again
    for a new state when one of those parts changed.

    In most cases, you'll want to use the
    [`provide`](https://codemirror.net/6/docs/ref/#state.StateField^define^config.provide) option when
    defining a field instead.
    */
    compute(deps: readonly Slot<any>[], get: (state: EditorState) => Input): Extension;
    /**
    Create an extension that computes zero or more values for this
    facet from a state.
    */
    computeN(deps: readonly Slot<any>[], get: (state: EditorState) => readonly Input[]): Extension;
    /**
    Shorthand method for registering a facet source with a state
    field as input. If the field's type corresponds to this facet's
    input type, the getter function can be omitted. If given, it
    will be used to retrieve the input from the field value.
    */
    from(field: StateField<Input>): Extension;
    from<T>(field: StateField<T>, get: (value: T) => Input): Extension;
}
declare type Slot<T> = Facet<any, T> | StateField<T> | "doc" | "selection";
declare type StateFieldSpec<Value> = {
    /**
    Creates the initial value for the field when a state is created.
    */
    create: (state: EditorState) => Value;
    /**
    Compute a new value from the field's previous value and a
    [transaction](https://codemirror.net/6/docs/ref/#state.Transaction).
    */
    update: (value: Value, transaction: Transaction) => Value;
    /**
    Compare two values of the field, returning `true` when they are
    the same. This is used to avoid recomputing facets that depend
    on the field when its value did not change. Defaults to using
    `===`.
    */
    compare?: (a: Value, b: Value) => boolean;
    /**
    Provide values for facets based on the value of this field. The
    given function will be called once with the initialized field. It
    will usually want to call some facet's
    [`from`](https://codemirror.net/6/docs/ref/#state.Facet.from) method to create facet inputs from
    this field, but can also return other extensions that should be
    enabled by this field.
    */
    provide?: (field: StateField<Value>) => Extension;
    /**
    A function used to serialize this field's content to JSON. Only
    necessary when this field is included in the argument to
    [`EditorState.toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON).
    */
    toJSON?: (value: Value, state: EditorState) => any;
    /**
    A function that deserializes the JSON representation of this
    field's content.
    */
    fromJSON?: (json: any, state: EditorState) => Value;
};
/**
Fields can store additional information in an editor state, and
keep it in sync with the rest of the state.
*/
declare class StateField<Value> {
    private createF;
    private updateF;
    private compareF;
    private constructor();
    /**
    Define a state field.
    */
    static define<Value>(config: StateFieldSpec<Value>): StateField<Value>;
    private create;
    /**
    Returns an extension that enables this field and overrides the
    way it is initialized. Can be useful when you need to provide a
    non-default starting value for the field.
    */
    init(create: (state: EditorState) => Value): Extension;
    /**
    State field instances can be used as
    [`Extension`](https://codemirror.net/6/docs/ref/#state.Extension) values to enable the field in a
    given state.
    */
    get extension(): Extension;
}
/**
Extension values can be
[provided](https://codemirror.net/6/docs/ref/#state.EditorStateConfig.extensions) when creating a
state to attach various kinds of configuration and behavior
information. They can either be built-in extension-providing
objects, such as [state fields](https://codemirror.net/6/docs/ref/#state.StateField) or [facet
providers](https://codemirror.net/6/docs/ref/#state.Facet.of), or objects with an extension in its
`extension` property. Extensions can be nested in arrays
arbitrarily deep—they will be flattened when processed.
*/
declare type Extension = {
    extension: Extension;
} | readonly Extension[];
/**
By default extensions are registered in the order they are found
in the flattened form of nested array that was provided.
Individual extension values can be assigned a precedence to
override this. Extensions that do not have a precedence set get
the precedence of the nearest parent with a precedence, or
[`default`](https://codemirror.net/6/docs/ref/#state.Prec.default) if there is no such parent. The
final ordering of extensions is determined by first sorting by
precedence and then by order within each precedence.
*/
declare const Prec: {
    /**
    A precedence below the default precedence, which will cause
    default-precedence extensions to override it even if they are
    specified later in the extension ordering.
    */
    fallback: (ext: Extension) => Extension;
    /**
    The regular default precedence.
    */
    default: (ext: Extension) => Extension;
    /**
    A higher-than-default precedence.
    */
    extend: (ext: Extension) => Extension;
    /**
    Precedence above the `default` and `extend` precedences.
    */
    override: (ext: Extension) => Extension;
};
/**
Extension compartments can be used to make a configuration
dynamic. By [wrapping](https://codemirror.net/6/docs/ref/#state.Compartment.of) part of your
configuration in a compartment, you can later
[replace](https://codemirror.net/6/docs/ref/#state.Compartment.reconfigure) that part through a
transaction.
*/
declare class Compartment {
    /**
    Create an instance of this compartment to add to your [state
    configuration](https://codemirror.net/6/docs/ref/#state.EditorStateConfig.extensions).
    */
    of(ext: Extension): Extension;
    /**
    Create an [effect](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) that
    reconfigures this compartment.
    */
    reconfigure(content: Extension): StateEffect<unknown>;
    /**
    Get the current content of the compartment in the state, or
    `undefined` if it isn't present.
    */
    get(state: EditorState): Extension | undefined;
}

/**
Annotations are tagged values that are used to add metadata to
transactions in an extensible way. They should be used to model
things that effect the entire transaction (such as its [time
stamp](https://codemirror.net/6/docs/ref/#state.Transaction^time) or information about its
[origin](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent)). For effects that happen
_alongside_ the other changes made by the transaction, [state
effects](https://codemirror.net/6/docs/ref/#state.StateEffect) are more appropriate.
*/
declare class Annotation<T> {
    /**
    The annotation type.
    */
    readonly type: AnnotationType<T>;
    /**
    The value of this annotation.
    */
    readonly value: T;
    /**
    Define a new type of annotation.
    */
    static define<T>(): AnnotationType<T>;
    private _isAnnotation;
}
/**
Marker that identifies a type of [annotation](https://codemirror.net/6/docs/ref/#state.Annotation).
*/
declare class AnnotationType<T> {
    /**
    Create an instance of this annotation.
    */
    of(value: T): Annotation<T>;
}
interface StateEffectSpec<Value> {
    /**
    Provides a way to map an effect like this through a position
    mapping. When not given, the effects will simply not be mapped.
    When the function returns `undefined`, that means the mapping
    deletes the effect.
    */
    map?: (value: Value, mapping: ChangeDesc) => Value | undefined;
}
/**
Representation of a type of state effect. Defined with
[`StateEffect.define`](https://codemirror.net/6/docs/ref/#state.StateEffect^define).
*/
declare class StateEffectType<Value> {
    /**
    @internal
    */
    readonly map: (value: any, mapping: ChangeDesc) => any | undefined;
    /**
    Create a [state effect](https://codemirror.net/6/docs/ref/#state.StateEffect) instance of this
    type.
    */
    of(value: Value): StateEffect<Value>;
}
/**
State effects can be used to represent additional effects
associated with a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction.effects). They
are often useful to model changes to custom [state
fields](https://codemirror.net/6/docs/ref/#state.StateField), when those changes aren't implicit in
document or selection changes.
*/
declare class StateEffect<Value> {
    /**
    The value of this effect.
    */
    readonly value: Value;
    /**
    Map this effect through a position mapping. Will return
    `undefined` when that ends up deleting the effect.
    */
    map(mapping: ChangeDesc): StateEffect<Value> | undefined;
    /**
    Tells you whether this effect object is of a given
    [type](https://codemirror.net/6/docs/ref/#state.StateEffectType).
    */
    is<T>(type: StateEffectType<T>): this is StateEffect<T>;
    /**
    Define a new effect type. The type parameter indicates the type
    of values that his effect holds.
    */
    static define<Value = null>(spec?: StateEffectSpec<Value>): StateEffectType<Value>;
    /**
    Map an array of effects through a change set.
    */
    static mapEffects(effects: readonly StateEffect<any>[], mapping: ChangeDesc): readonly StateEffect<any>[];
    /**
    This effect can be used to reconfigure the root extensions of
    the editor. Doing this will discard any extensions
    [appended](https://codemirror.net/6/docs/ref/#state.StateEffect^appendConfig), but does not reset
    the content of [reconfigured](https://codemirror.net/6/docs/ref/#state.Compartment.reconfigure)
    compartments.
    */
    static reconfigure: StateEffectType<Extension>;
    /**
    Append extensions to the top-level configuration of the editor.
    */
    static appendConfig: StateEffectType<Extension>;
}
/**
Describes a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction) when calling the
[`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update) method.
*/
interface TransactionSpec {
    /**
    The changes to the document made by this transaction.
    */
    changes?: ChangeSpec;
    /**
    When set, this transaction explicitly updates the selection.
    Offsets in this selection should refer to the document as it is
    _after_ the transaction.
    */
    selection?: EditorSelection | {
        anchor: number;
        head?: number;
    };
    /**
    Attach [state effects](https://codemirror.net/6/docs/ref/#state.StateEffect) to this transaction.
    Again, when they contain positions and this same spec makes
    changes, those positions should refer to positions in the
    updated document.
    */
    effects?: StateEffect<any> | readonly StateEffect<any>[];
    /**
    Set [annotations](https://codemirror.net/6/docs/ref/#state.Annotation) for this transaction.
    */
    annotations?: Annotation<any> | readonly Annotation<any>[];
    /**
    Shorthand for `annotations: `[`Transaction.userEvent`](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent)[`.of(...)`.
    */
    userEvent?: string;
    /**
    When set to `true`, the transaction is marked as needing to
    scroll the current selection into view.
    */
    scrollIntoView?: boolean;
    /**
    By default, transactions can be modified by [change
    filters](https://codemirror.net/6/docs/ref/#state.EditorState^changeFilter) and [transaction
    filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter). You can set this
    to `false` to disable that.
    */
    filter?: boolean;
    /**
    Normally, when multiple specs are combined (for example by
    [`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update)), the
    positions in `changes` are taken to refer to the document
    positions in the initial document. When a spec has `sequental`
    set to true, its positions will be taken to refer to the
    document created by the specs before it instead.
    */
    sequential?: boolean;
}
/**
Changes to the editor state are grouped into transactions.
Typically, a user action creates a single transaction, which may
contain any number of document changes, may change the selection,
or have other effects. Create a transaction by calling
[`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update).
*/
declare class Transaction {
    /**
    The state from which the transaction starts.
    */
    readonly startState: EditorState;
    /**
    The document changes made by this transaction.
    */
    readonly changes: ChangeSet;
    /**
    The selection set by this transaction, or undefined if it
    doesn't explicitly set a selection.
    */
    readonly selection: EditorSelection | undefined;
    /**
    The effects added to the transaction.
    */
    readonly effects: readonly StateEffect<any>[];
    /**
    Whether the selection should be scrolled into view after this
    transaction is dispatched.
    */
    readonly scrollIntoView: boolean;
    /**
    The new document produced by the transaction. Contrary to
    [`.state`](https://codemirror.net/6/docs/ref/#state.Transaction.state)`.doc`, accessing this won't
    force the entire new state to be computed right away, so it is
    recommended that [transaction
    filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter) use this getter
    when they need to look at the new document.
    */
    get newDoc(): Text;
    /**
    The new selection produced by the transaction. If
    [`this.selection`](https://codemirror.net/6/docs/ref/#state.Transaction.selection) is undefined,
    this will [map](https://codemirror.net/6/docs/ref/#state.EditorSelection.map) the start state's
    current selection through the changes made by the transaction.
    */
    get newSelection(): EditorSelection;
    /**
    The new state created by the transaction. Computed on demand
    (but retained for subsequent access), so itis recommended not to
    access it in [transaction
    filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter) when possible.
    */
    get state(): EditorState;
    /**
    Get the value of the given annotation type, if any.
    */
    annotation<T>(type: AnnotationType<T>): T | undefined;
    /**
    Indicates whether the transaction changed the document.
    */
    get docChanged(): boolean;
    /**
    Indicates whether this transaction reconfigures the state
    (through a [configuration compartment](https://codemirror.net/6/docs/ref/#state.Compartment) or
    with a top-level configuration
    [effect](https://codemirror.net/6/docs/ref/#state.StateEffect^reconfigure).
    */
    get reconfigured(): boolean;
    /**
    Returns true if the transaction has a [user
    event](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent) annotation that is equal to
    or more specific than `event`. For example, if the transaction
    has `"select.pointer"` as user event, `"select"` and
    `"select.pointer"` will match it.
    */
    isUserEvent(event: string): boolean | "" | undefined;
    /**
    Annotation used to store transaction timestamps.
    */
    static time: AnnotationType<number>;
    /**
    Annotation used to associate a transaction with a user interface
    event. Holds a string identifying the event, using a
    dot-separated format to support attaching more specific
    information. The events used by the core libraries are:

     - `"input"` when content is entered
       - `"input.type"` for typed input
         - `"input.type.compose"` for composition
       - `"input.paste"` for pasted input
       - `"input.drop"` when adding content with drag-and-drop
       - `"input.complete"` when autocompleting
     - `"delete"` when the user deletes content
       - `"delete.selection"` when deleting the selection
       - `"delete.forward"` when deleting forward from the selection
       - `"delete.backward"` when deleting backward from the selection
       - `"delete.cut"` when cutting to the clipboard
     - `"move"` when content is moved
       - `"move.drop"` when content is moved within the editor through drag-and-drop
     - `"select"` when explicitly changing the selection
       - `"select.pointer"` when selecting with a mouse or other pointing device
     - `"undo"` and `"redo"` for history actions

    Use [`isUserEvent`](https://codemirror.net/6/docs/ref/#state.Transaction.isUserEvent) to check
    whether the annotation matches a given event.
    */
    static userEvent: AnnotationType<string>;
    /**
    Annotation indicating whether a transaction should be added to
    the undo history or not.
    */
    static addToHistory: AnnotationType<boolean>;
    /**
    Annotation indicating (when present and true) that a transaction
    represents a change made by some other actor, not the user. This
    is used, for example, to tag other people's changes in
    collaborative editing.
    */
    static remote: AnnotationType<boolean>;
}

/**
The categories produced by a [character
categorizer](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer). These are used
do things like selecting by word.
*/
declare enum CharCategory {
    /**
    Word characters.
    */
    Word = 0,
    /**
    Whitespace.
    */
    Space = 1,
    /**
    Anything else.
    */
    Other = 2
}

/**
Options passed when [creating](https://codemirror.net/6/docs/ref/#state.EditorState^create) an
editor state.
*/
interface EditorStateConfig {
    /**
    The initial document. Defaults to an empty document. Can be
    provided either as a plain string (which will be split into
    lines according to the value of the [`lineSeparator`
    facet](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator)), or an instance of
    the [`Text`](https://codemirror.net/6/docs/ref/#text.Text) class (which is what the state will use
    to represent the document).
    */
    doc?: string | Text;
    /**
    The starting selection. Defaults to a cursor at the very start
    of the document.
    */
    selection?: EditorSelection | {
        anchor: number;
        head?: number;
    };
    /**
    [Extension(s)](https://codemirror.net/6/docs/ref/#state.Extension) to associate with this state.
    */
    extensions?: Extension;
}
/**
The editor state class is a persistent (immutable) data structure.
To update a state, you [create](https://codemirror.net/6/docs/ref/#state.EditorState.update) a
[transaction](https://codemirror.net/6/docs/ref/#state.Transaction), which produces a _new_ state
instance, without modifying the original object.

As such, _never_ mutate properties of a state directly. That'll
just break things.
*/
declare class EditorState {
    /**
    The current document.
    */
    readonly doc: Text;
    /**
    The current selection.
    */
    readonly selection: EditorSelection;
    /**
    Retrieve the value of a [state field](https://codemirror.net/6/docs/ref/#state.StateField). Throws
    an error when the state doesn't have that field, unless you pass
    `false` as second parameter.
    */
    field<T>(field: StateField<T>): T;
    field<T>(field: StateField<T>, require: false): T | undefined;
    /**
    Create a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction) that updates this
    state. Any number of [transaction specs](https://codemirror.net/6/docs/ref/#state.TransactionSpec)
    can be passed. Unless
    [`sequential`](https://codemirror.net/6/docs/ref/#state.TransactionSpec.sequential) is set, the
    [changes](https://codemirror.net/6/docs/ref/#state.TransactionSpec.changes) (if any) of each spec
    are assumed to start in the _current_ document (not the document
    produced by previous specs), and its
    [selection](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection) and
    [effects](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) are assumed to refer
    to the document created by its _own_ changes. The resulting
    transaction contains the combined effect of all the different
    specs. For [selection](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection), later
    specs take precedence over earlier ones.
    */
    update(...specs: readonly TransactionSpec[]): Transaction;
    /**
    Create a [transaction spec](https://codemirror.net/6/docs/ref/#state.TransactionSpec) that
    replaces every selection range with the given content.
    */
    replaceSelection(text: string | Text): {
        changes: ChangeSet;
        selection: EditorSelection;
        effects: readonly StateEffect<any>[];
    };
    /**
    Create a set of changes and a new selection by running the given
    function for each range in the active selection. The function
    can return an optional set of changes (in the coordinate space
    of the start document), plus an updated range (in the coordinate
    space of the document produced by the call's own changes). This
    method will merge all the changes and ranges into a single
    changeset and selection, and return it as a [transaction
    spec](https://codemirror.net/6/docs/ref/#state.TransactionSpec), which can be passed to
    [`update`](https://codemirror.net/6/docs/ref/#state.EditorState.update).
    */
    changeByRange(f: (range: SelectionRange) => {
        range: SelectionRange;
        changes?: ChangeSpec;
        effects?: StateEffect<any> | readonly StateEffect<any>[];
    }): {
        changes: ChangeSet;
        selection: EditorSelection;
        effects: readonly StateEffect<any>[];
    };
    /**
    Create a [change set](https://codemirror.net/6/docs/ref/#state.ChangeSet) from the given change
    description, taking the state's document length and line
    separator into account.
    */
    changes(spec?: ChangeSpec): ChangeSet;
    /**
    Using the state's [line
    separator](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator), create a
    [`Text`](https://codemirror.net/6/docs/ref/#text.Text) instance from the given string.
    */
    toText(string: string): Text;
    /**
    Return the given range of the document as a string.
    */
    sliceDoc(from?: number, to?: number): string;
    /**
    Get the value of a state [facet](https://codemirror.net/6/docs/ref/#state.Facet).
    */
    facet<Output>(facet: Facet<any, Output>): Output;
    /**
    Convert this state to a JSON-serializable object. When custom
    fields should be serialized, you can pass them in as an object
    mapping property names (in the resulting object, which should
    not use `doc` or `selection`) to fields.
    */
    toJSON(fields?: {
        [prop: string]: StateField<any>;
    }): any;
    /**
    Deserialize a state from its JSON representation. When custom
    fields should be deserialized, pass the same object you passed
    to [`toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) when serializing as
    third argument.
    */
    static fromJSON(json: any, config?: EditorStateConfig, fields?: {
        [prop: string]: StateField<any>;
    }): EditorState;
    /**
    Create a new state. You'll usually only need this when
    initializing an editor—updated states are created by applying
    transactions.
    */
    static create(config?: EditorStateConfig): EditorState;
    /**
    A facet that, when enabled, causes the editor to allow multiple
    ranges to be selected. Be careful though, because by default the
    editor relies on the native DOM selection, which cannot handle
    multiple selections. An extension like
    [`drawSelection`](https://codemirror.net/6/docs/ref/#view.drawSelection) can be used to make
    secondary selections visible to the user.
    */
    static allowMultipleSelections: Facet<boolean, boolean>;
    /**
    Configures the tab size to use in this state. The first
    (highest-precedence) value of the facet is used. If no value is
    given, this defaults to 4.
    */
    static tabSize: Facet<number, number>;
    /**
    The size (in columns) of a tab in the document, determined by
    the [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) facet.
    */
    get tabSize(): number;
    /**
    The line separator to use. By default, any of `"\n"`, `"\r\n"`
    and `"\r"` is treated as a separator when splitting lines, and
    lines are joined with `"\n"`.

    When you configure a value here, only that precise separator
    will be used, allowing you to round-trip documents through the
    editor without normalizing line separators.
    */
    static lineSeparator: Facet<string, string | undefined>;
    /**
    Get the proper [line-break](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator)
    string for this state.
    */
    get lineBreak(): string;
    /**
    Registers translation phrases. The
    [`phrase`](https://codemirror.net/6/docs/ref/#state.EditorState.phrase) method will look through
    all objects registered with this facet to find translations for
    its argument.
    */
    static phrases: Facet<{
        [key: string]: string;
    }, readonly {
        [key: string]: string;
    }[]>;
    /**
    Look up a translation for the given phrase (via the
    [`phrases`](https://codemirror.net/6/docs/ref/#state.EditorState^phrases) facet), or return the
    original string if no translation is found.
    */
    phrase(phrase: string): string;
    /**
    A facet used to register [language
    data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) providers.
    */
    static languageData: Facet<(state: EditorState, pos: number, side: 0 | 1 | -1) => readonly {
        [name: string]: any;
    }[], readonly ((state: EditorState, pos: number, side: 0 | 1 | -1) => readonly {
        [name: string]: any;
    }[])[]>;
    /**
    Find the values for a given language data field, provided by the
    the [`languageData`](https://codemirror.net/6/docs/ref/#state.EditorState^languageData) facet.
    */
    languageDataAt<T>(name: string, pos: number, side?: -1 | 0 | 1): readonly T[];
    /**
    Return a function that can categorize strings (expected to
    represent a single [grapheme cluster](https://codemirror.net/6/docs/ref/#text.findClusterBreak))
    into one of:

     - Word (contains an alphanumeric character or a character
       explicitly listed in the local language's `"wordChars"`
       language data, which should be a string)
     - Space (contains only whitespace)
     - Other (anything else)
    */
    charCategorizer(at: number): (char: string) => CharCategory;
    /**
    Find the word at the given position, meaning the range
    containing all [word](https://codemirror.net/6/docs/ref/#state.CharCategory.Word) characters
    around it. If no word characters are adjacent to the position,
    this returns null.
    */
    wordAt(pos: number): SelectionRange | null;
    /**
    Facet used to register change filters, which are called for each
    transaction (unless explicitly
    [disabled](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter)), and can suppress
    part of the transaction's changes.

    Such a function can return `true` to indicate that it doesn't
    want to do anything, `false` to completely stop the changes in
    the transaction, or a set of ranges in which changes should be
    suppressed. Such ranges are represented as an array of numbers,
    with each pair of two number indicating the start and end of a
    range. So for example `[10, 20, 100, 110]` suppresses changes
    between 10 and 20, and between 100 and 110.
    */
    static changeFilter: Facet<(tr: Transaction) => boolean | readonly number[], readonly ((tr: Transaction) => boolean | readonly number[])[]>;
    /**
    Facet used to register a hook that gets a chance to update or
    replace transaction specs before they are applied. This will
    only be applied for transactions that don't have
    [`filter`](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter) set to `false`. You
    can either return a single transaction spec (possibly the input
    transaction), or an array of specs (which will be combined in
    the same way as the arguments to
    [`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update)).

    When possible, it is recommended to avoid accessing
    [`Transaction.state`](https://codemirror.net/6/docs/ref/#state.Transaction.state) in a filter,
    since it will force creation of a state that will then be
    discarded again, if the transaction is actually filtered.

    (This functionality should be used with care. Indiscriminately
    modifying transaction is likely to break something or degrade
    the user experience.)
    */
    static transactionFilter: Facet<(tr: Transaction) => TransactionSpec | readonly TransactionSpec[], readonly ((tr: Transaction) => TransactionSpec | readonly TransactionSpec[])[]>;
    /**
    This is a more limited form of
    [`transactionFilter`](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter),
    which can only add
    [annotations](https://codemirror.net/6/docs/ref/#state.TransactionSpec.annotations) and
    [effects](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects). _But_, this type
    of filter runs even the transaction has disabled regular
    [filtering](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter), making it suitable
    for effects that don't need to touch the changes or selection,
    but do want to process every transaction.

    Extenders run _after_ filters, when both are applied.
    */
    static transactionExtender: Facet<(tr: Transaction) => Pick<TransactionSpec, "effects" | "annotations"> | null, readonly ((tr: Transaction) => Pick<TransactionSpec, "effects" | "annotations"> | null)[]>;
}

/**
Subtype of [`Command`](https://codemirror.net/6/docs/ref/#view.Command) that doesn't require access
to the actual editor view. Mostly useful to define commands that
can be run and tested outside of a browser environment.
*/
declare type StateCommand = (target: {
    state: EditorState;
    dispatch: (transaction: Transaction) => void;
}) => boolean;

/**
Utility function for combining behaviors to fill in a config
object from an array of provided configs. Will, by default, error
when a field gets two values that aren't `===`-equal, but you can
provide combine functions per field to do something else.
*/
declare function combineConfig<Config>(configs: readonly Partial<Config>[], defaults: Partial<Config>, // Should hold only the optional properties of Config, but I haven't managed to express that
combine?: {
    [P in keyof Config]?: (first: Config[P], second: Config[P]) => Config[P];
}): Config;

type index_d$b_Annotation<_0> = Annotation<_0>;
declare const index_d$b_Annotation: typeof Annotation;
type index_d$b_AnnotationType<_0> = AnnotationType<_0>;
declare const index_d$b_AnnotationType: typeof AnnotationType;
type index_d$b_ChangeDesc = ChangeDesc;
declare const index_d$b_ChangeDesc: typeof ChangeDesc;
type index_d$b_ChangeSet = ChangeSet;
declare const index_d$b_ChangeSet: typeof ChangeSet;
type index_d$b_ChangeSpec = ChangeSpec;
type index_d$b_CharCategory = CharCategory;
declare const index_d$b_CharCategory: typeof CharCategory;
type index_d$b_Compartment = Compartment;
declare const index_d$b_Compartment: typeof Compartment;
type index_d$b_EditorSelection = EditorSelection;
declare const index_d$b_EditorSelection: typeof EditorSelection;
type index_d$b_EditorState = EditorState;
declare const index_d$b_EditorState: typeof EditorState;
type index_d$b_EditorStateConfig = EditorStateConfig;
type index_d$b_Extension = Extension;
type index_d$b_Facet<_0, _1> = Facet<_0, _1>;
declare const index_d$b_Facet: typeof Facet;
type index_d$b_MapMode = MapMode;
declare const index_d$b_MapMode: typeof MapMode;
declare const index_d$b_Prec: typeof Prec;
type index_d$b_SelectionRange = SelectionRange;
declare const index_d$b_SelectionRange: typeof SelectionRange;
type index_d$b_StateCommand = StateCommand;
type index_d$b_StateEffect<_0> = StateEffect<_0>;
declare const index_d$b_StateEffect: typeof StateEffect;
type index_d$b_StateEffectType<_0> = StateEffectType<_0>;
declare const index_d$b_StateEffectType: typeof StateEffectType;
type index_d$b_StateField<_0> = StateField<_0>;
declare const index_d$b_StateField: typeof StateField;
type index_d$b_Transaction = Transaction;
declare const index_d$b_Transaction: typeof Transaction;
type index_d$b_TransactionSpec = TransactionSpec;
declare const index_d$b_combineConfig: typeof combineConfig;
type index_d$b_Text = Text;
declare const index_d$b_Text: typeof Text;
declare namespace index_d$b {
  export {
    index_d$b_Annotation as Annotation,
    index_d$b_AnnotationType as AnnotationType,
    index_d$b_ChangeDesc as ChangeDesc,
    index_d$b_ChangeSet as ChangeSet,
    index_d$b_ChangeSpec as ChangeSpec,
    index_d$b_CharCategory as CharCategory,
    index_d$b_Compartment as Compartment,
    index_d$b_EditorSelection as EditorSelection,
    index_d$b_EditorState as EditorState,
    index_d$b_EditorStateConfig as EditorStateConfig,
    index_d$b_Extension as Extension,
    index_d$b_Facet as Facet,
    index_d$b_MapMode as MapMode,
    index_d$b_Prec as Prec,
    index_d$b_SelectionRange as SelectionRange,
    index_d$b_StateCommand as StateCommand,
    index_d$b_StateEffect as StateEffect,
    index_d$b_StateEffectType as StateEffectType,
    index_d$b_StateField as StateField,
    index_d$b_Transaction as Transaction,
    index_d$b_TransactionSpec as TransactionSpec,
    index_d$b_combineConfig as combineConfig,
    index_d$b_Text as Text,
  };
}

/**
Each range is associated with a value, which must inherit from
this class.
*/
declare abstract class RangeValue {
    /**
    Compare this value with another value. The default
    implementation compares by identity.
    */
    eq(other: RangeValue): boolean;
    /**
    The bias value at the start of the range. Determines how the
    range is positioned relative to other ranges starting at this
    position. Defaults to 0.
    */
    startSide: number;
    /**
    The bias value at the end of the range. Defaults to 0.
    */
    endSide: number;
    /**
    The mode with which the location of the range should be mapped
    when its `from` and `to` are the same, to decide whether a
    change deletes the range. Defaults to `MapMode.TrackDel`.
    */
    mapMode: MapMode;
    /**
    Whether this value marks a point range, which is treated as
    atomic and shadows the ranges contained in it.
    */
    point: boolean;
    /**
    Create a [range](https://codemirror.net/6/docs/ref/#rangeset.Range) with this value.
    */
    range(from: number, to?: number): Range<this>;
}
/**
A range associates a value with a range of positions.
*/
declare class Range<T extends RangeValue> {
    /**
    The range's start position.
    */
    readonly from: number;
    /**
    Its end position.
    */
    readonly to: number;
    /**
    The value associated with this range.
    */
    readonly value: T;
}
/**
Collection of methods used when comparing range sets.
*/
interface RangeComparator<T extends RangeValue> {
    /**
    Notifies the comparator that the given range has the given set
    of values associated with it.
    */
    compareRange(from: number, to: number, activeA: T[], activeB: T[]): void;
    /**
    Notification for a point range.
    */
    comparePoint(from: number, to: number, byA: T | null, byB: T | null): void;
}
/**
Methods used when iterating over the spans created by a set of
ranges. The entire iterated range will be covered with either
`span` or `point` calls.
*/
interface SpanIterator<T extends RangeValue> {
    /**
    Called for any ranges not covered by point decorations. `active`
    holds the values that the range is marked with (and may be
    empty). `openStart` indicates how many of those ranges are open
    (continued) at the start of the span.
    */
    span(from: number, to: number, active: readonly T[], openStart: number): void;
    /**
    Called when going over a point decoration. The active range
    decorations that cover the point and have a higher precedence
    are provided in `active`. The open count in `openStart` counts
    the number of those ranges that started before the point and. If
    the point started before the iterated range, `openStart` will be
    `active.length + 1` to signal this.
    */
    point(from: number, to: number, value: T, active: readonly T[], openStart: number): void;
}
/**
A range cursor is an object that moves to the next range every
time you call `next` on it. Note that, unlike ES6 iterators, these
start out pointing at the first element, so you should call `next`
only after reading the first range (if any).
*/
interface RangeCursor<T> {
    /**
    Move the iterator forward.
    */
    next: () => void;
    /**
    The next range's value. Holds `null` when the cursor has reached
    its end.
    */
    value: T | null;
    /**
    The next range's start position.
    */
    from: number;
    /**
    The next end position.
    */
    to: number;
}
declare type RangeSetUpdate<T extends RangeValue> = {
    /**
    An array of ranges to add. If given, this should be sorted by
    `from` position and `startSide` unless
    [`sort`](https://codemirror.net/6/docs/ref/#rangeset.RangeSet.update^updateSpec.sort) is given as
    `true`.
    */
    add?: readonly Range<T>[];
    /**
    Indicates whether the library should sort the ranges in `add`.
    Defaults to `false`.
    */
    sort?: boolean;
    /**
    Filter the ranges already in the set. Only those for which this
    function returns `true` are kept.
    */
    filter?: (from: number, to: number, value: T) => boolean;
    /**
    Can be used to limit the range on which the filter is
    applied. Filtering only a small range, as opposed to the entire
    set, can make updates cheaper.
    */
    filterFrom?: number;
    /**
    The end position to apply the filter to.
    */
    filterTo?: number;
};
/**
A range set stores a collection of [ranges](https://codemirror.net/6/docs/ref/#rangeset.Range) in a
way that makes them efficient to [map](https://codemirror.net/6/docs/ref/#rangeset.RangeSet.map) and
[update](https://codemirror.net/6/docs/ref/#rangeset.RangeSet.update). This is an immutable data
structure.
*/
declare class RangeSet<T extends RangeValue> {
    /**
    The number of ranges in the set.
    */
    get size(): number;
    /**
    Update the range set, optionally adding new ranges or filtering
    out existing ones.

    (The extra type parameter is just there as a kludge to work
    around TypeScript variance issues that prevented `RangeSet<X>`
    from being a subtype of `RangeSet<Y>` when `X` is a subtype of
    `Y`.)
    */
    update<U extends T>(updateSpec: RangeSetUpdate<U>): RangeSet<T>;
    /**
    Map this range set through a set of changes, return the new set.
    */
    map(changes: ChangeDesc): RangeSet<T>;
    /**
    Iterate over the ranges that touch the region `from` to `to`,
    calling `f` for each. There is no guarantee that the ranges will
    be reported in any specific order. When the callback returns
    `false`, iteration stops.
    */
    between(from: number, to: number, f: (from: number, to: number, value: T) => void | false): void;
    /**
    Iterate over the ranges in this set, in order, including all
    ranges that end at or after `from`.
    */
    iter(from?: number): RangeCursor<T>;
    /**
    Iterate over the ranges in a collection of sets, in order,
    starting from `from`.
    */
    static iter<T extends RangeValue>(sets: readonly RangeSet<T>[], from?: number): RangeCursor<T>;
    /**
    Iterate over two groups of sets, calling methods on `comparator`
    to notify it of possible differences.
    */
    static compare<T extends RangeValue>(oldSets: readonly RangeSet<T>[], newSets: readonly RangeSet<T>[],
    /**
    This indicates how the underlying data changed between these
    ranges, and is needed to synchronize the iteration. `from` and
    `to` are coordinates in the _new_ space, after these changes.
    */
    textDiff: ChangeDesc, comparator: RangeComparator<T>,
    /**
    Can be used to ignore all non-point ranges, and points below
    the given size. When -1, all ranges are compared.
    */
    minPointSize?: number): void;
    /**
    Compare the contents of two groups of range sets, returning true
    if they are equivalent in the given range.
    */
    static eq<T extends RangeValue>(oldSets: readonly RangeSet<T>[], newSets: readonly RangeSet<T>[], from?: number, to?: number): boolean;
    /**
    Iterate over a group of range sets at the same time, notifying
    the iterator about the ranges covering every given piece of
    content. Returns the open count (see
    [`SpanIterator.span`](https://codemirror.net/6/docs/ref/#rangeset.SpanIterator.span)) at the end
    of the iteration.
    */
    static spans<T extends RangeValue>(sets: readonly RangeSet<T>[], from: number, to: number, iterator: SpanIterator<T>,
    /**
    When given and greater than -1, only points of at least this
    size are taken into account.
    */
    minPointSize?: number): number;
    /**
    Create a range set for the given range or array of ranges. By
    default, this expects the ranges to be _sorted_ (by start
    position and, if two start at the same position,
    `value.startSide`). You can pass `true` as second argument to
    cause the method to sort them.
    */
    static of<T extends RangeValue>(ranges: readonly Range<T>[] | Range<T>, sort?: boolean): RangeSet<T>;
    /**
    The empty set of ranges.
    */
    static empty: RangeSet<any>;
}

declare class StyleModule {
  constructor(spec: {[selector: string]: StyleSpec}, options?: {
    finish?(sel: string): string
  })
  getRules(): string
  static mount(root: Document | ShadowRoot | DocumentOrShadowRoot, module: StyleModule | ReadonlyArray<StyleModule>): void
  static newName(): string
}

type StyleSpec = {
  [propOrSelector: string]: string | number | StyleSpec | null
}

declare type Attrs = {
    [name: string]: string;
};

interface MarkDecorationSpec {
    /**
    Whether the mark covers its start and end position or not. This
    influences whether content inserted at those positions becomes
    part of the mark. Defaults to false.
    */
    inclusive?: boolean;
    /**
    Specify whether the start position of the marked range should be
    inclusive. Overrides `inclusive`, when both are present.
    */
    inclusiveStart?: boolean;
    /**
    Whether the end should be inclusive.
    */
    inclusiveEnd?: boolean;
    /**
    Add attributes to the DOM elements that hold the text in the
    marked range.
    */
    attributes?: {
        [key: string]: string;
    };
    /**
    Shorthand for `{attributes: {class: value}}`.
    */
    class?: string;
    /**
    Add a wrapping element around the text in the marked range. Note
    that there will not be a single element covering the entire
    range—content is split on mark starts and ends, and each piece
    gets its own element.
    */
    tagName?: string;
    /**
    Decoration specs allow extra properties, which can be retrieved
    through the decoration's [`spec`](https://codemirror.net/6/docs/ref/#view.Decoration.spec)
    property.
    */
    [other: string]: any;
}
interface WidgetDecorationSpec {
    /**
    The type of widget to draw here.
    */
    widget: WidgetType;
    /**
    Which side of the given position the widget is on. When this is
    positive, the widget will be drawn after the cursor if the
    cursor is on the same position. Otherwise, it'll be drawn before
    it. When multiple widgets sit at the same position, their `side`
    values will determine their ordering—those with a lower value
    come first. Defaults to 0.
    */
    side?: number;
    /**
    Determines whether this is a block widgets, which will be drawn
    between lines, or an inline widget (the default) which is drawn
    between the surrounding text.

    Note that block-level decorations should not have vertical
    margins, and if you dynamically change their height, you should
    make sure to call
    [`requestMeasure`](https://codemirror.net/6/docs/ref/#view.EditorView.requestMeasure), so that the
    editor can update its information about its vertical layout.
    */
    block?: boolean;
    /**
    Other properties are allowed.
    */
    [other: string]: any;
}
interface ReplaceDecorationSpec {
    /**
    An optional widget to drawn in the place of the replaced
    content.
    */
    widget?: WidgetType;
    /**
    Whether this range covers the positions on its sides. This
    influences whether new content becomes part of the range and
    whether the cursor can be drawn on its sides. Defaults to false.
    */
    inclusive?: boolean;
    /**
    Set inclusivity at the start.
    */
    inclusiveStart?: boolean;
    /**
    Set inclusivity at the end.
    */
    inclusiveEnd?: boolean;
    /**
    Whether this is a block-level decoration. Defaults to false.
    */
    block?: boolean;
    /**
    Other properties are allowed.
    */
    [other: string]: any;
}
interface LineDecorationSpec {
    /**
    DOM attributes to add to the element wrapping the line.
    */
    attributes?: {
        [key: string]: string;
    };
    /**
    Other properties are allowed.
    */
    [other: string]: any;
}
/**
Widgets added to the content are described by subclasses of this
class. Using a description object like that makes it possible to
delay creating of the DOM structure for a widget until it is
needed, and to avoid redrawing widgets even when the decorations
that define them are recreated.
*/
declare abstract class WidgetType {
    /**
    Build the DOM structure for this widget instance.
    */
    abstract toDOM(view: EditorView): HTMLElement;
    /**
    Compare this instance to another instance of the same type.
    (TypeScript can't express this, but only instances of the same
    specific class will be passed to this method.) This is used to
    avoid redrawing widgets when they are replaced by a new
    decoration of the same type. The default implementation just
    returns `false`, which will cause new instances of the widget to
    always be redrawn.
    */
    eq(_widget: WidgetType): boolean;
    /**
    Update a DOM element created by a widget of the same type (but
    different, non-`eq` content) to reflect this widget. May return
    true to indicate that it could update, false to indicate it
    couldn't (in which case the widget will be redrawn). The default
    implementation just returns false.
    */
    updateDOM(_dom: HTMLElement): boolean;
    /**
    The estimated height this widget will have, to be used when
    estimating the height of content that hasn't been drawn. May
    return -1 to indicate you don't know. The default implementation
    returns -1.
    */
    get estimatedHeight(): number;
    /**
    Can be used to configure which kinds of events inside the widget
    should be ignored by the editor. The default is to ignore all
    events.
    */
    ignoreEvent(_event: Event): boolean;
}
/**
A decoration set represents a collection of decorated ranges,
organized for efficient access and mapping. See
[`RangeSet`](https://codemirror.net/6/docs/ref/#rangeset.RangeSet) for its methods.
*/
declare type DecorationSet = RangeSet<Decoration>;
/**
The different types of blocks that can occur in an editor view.
*/
declare enum BlockType {
    /**
    A line of text.
    */
    Text = 0,
    /**
    A block widget associated with the position after it.
    */
    WidgetBefore = 1,
    /**
    A block widget associated with the position before it.
    */
    WidgetAfter = 2,
    /**
    A block widget [replacing](https://codemirror.net/6/docs/ref/#view.Decoration^replace) a range of content.
    */
    WidgetRange = 3
}
/**
A decoration provides information on how to draw or style a piece
of content. You'll usually use it wrapped in a
[`Range`](https://codemirror.net/6/docs/ref/#rangeset.Range), which adds a start and end position.
*/
declare abstract class Decoration extends RangeValue {
    /**
    The config object used to create this decoration. You can
    include additional properties in there to store metadata about
    your decoration.
    */
    readonly spec: any;
    abstract eq(other: Decoration): boolean;
    /**
    Create a mark decoration, which influences the styling of the
    content in its range. Nested mark decorations will cause nested
    DOM elements to be created. Nesting order is determined by
    precedence of the [facet](https://codemirror.net/6/docs/ref/#view.EditorView^decorations) or
    (below the facet-provided decorations) [view
    plugin](https://codemirror.net/6/docs/ref/#view.PluginSpec.decorations). Such elements are split
    on line boundaries and on the boundaries of higher-precedence
    decorations.
    */
    static mark(spec: MarkDecorationSpec): Decoration;
    /**
    Create a widget decoration, which adds an element at the given
    position.
    */
    static widget(spec: WidgetDecorationSpec): Decoration;
    /**
    Create a replace decoration which replaces the given range with
    a widget, or simply hides it.
    */
    static replace(spec: ReplaceDecorationSpec): Decoration;
    /**
    Create a line decoration, which can add DOM attributes to the
    line starting at the given position.
    */
    static line(spec: LineDecorationSpec): Decoration;
    /**
    Build a [`DecorationSet`](https://codemirror.net/6/docs/ref/#view.DecorationSet) from the given
    decorated range or ranges. If the ranges aren't already sorted,
    pass `true` for `sort` to make the library sort them for you.
    */
    static set(of: Range<Decoration> | readonly Range<Decoration>[], sort?: boolean): DecorationSet;
    /**
    The empty set of decorations.
    */
    static none: DecorationSet;
}

/**
Basic rectangle type.
*/
interface Rect {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

/**
Command functions are used in key bindings and other types of user
actions. Given an editor view, they check whether their effect can
apply to the editor, and if it can, perform it as a side effect
(which usually means [dispatching](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) a
transaction) and return `true`.
*/
declare type Command = (target: EditorView) => boolean;
/**
Log or report an unhandled exception in client code. Should
probably only be used by extension code that allows client code to
provide functions, and calls those functions in a context where an
exception can't be propagated to calling code in a reasonable way
(for example when in an event handler).

Either calls a handler registered with
[`EditorView.exceptionSink`](https://codemirror.net/6/docs/ref/#view.EditorView^exceptionSink),
`window.onerror`, if defined, or `console.error` (in which case
it'll pass `context`, when given, as first argument).
*/
declare function logException(state: EditorState, exception: any, context?: string): void;
/**
This is the interface plugin objects conform to.
*/
interface PluginValue {
    /**
    Notifies the plugin of an update that happened in the view. This
    is called _before_ the view updates its own DOM. It is
    responsible for updating the plugin's internal state (including
    any state that may be read by plugin fields) and _writing_ to
    the DOM for the changes in the update. To avoid unnecessary
    layout recomputations, it should _not_ read the DOM layout—use
    [`requestMeasure`](https://codemirror.net/6/docs/ref/#view.EditorView.requestMeasure) to schedule
    your code in a DOM reading phase if you need to.
    */
    update?(_update: ViewUpdate): void;
    /**
    Called when the plugin is no longer going to be used. Should
    revert any changes the plugin made to the DOM.
    */
    destroy?(): void;
}
declare const isFieldProvider: unique symbol;
/**
Used to [declare](https://codemirror.net/6/docs/ref/#view.PluginSpec.provide) which
[fields](https://codemirror.net/6/docs/ref/#view.PluginValue) a [view plugin](https://codemirror.net/6/docs/ref/#view.ViewPlugin)
provides.
*/
declare class PluginFieldProvider<V> {
    private [isFieldProvider];
}
/**
Plugin fields are a mechanism for allowing plugins to provide
values that can be retrieved through the
[`pluginField`](https://codemirror.net/6/docs/ref/#view.EditorView.pluginField) view method.
*/
declare class PluginField<T> {
    /**
    Create a [provider](https://codemirror.net/6/docs/ref/#view.PluginFieldProvider) for this field,
    to use with a plugin's [provide](https://codemirror.net/6/docs/ref/#view.PluginSpec.provide)
    option.
    */
    from<V extends PluginValue>(get: (value: V) => T): PluginFieldProvider<V>;
    /**
    Define a new plugin field.
    */
    static define<T>(): PluginField<T>;
    /**
    This field can be used by plugins to provide
    [decorations](https://codemirror.net/6/docs/ref/#view.Decoration).

    **Note**: For reasons of data flow (plugins are only updated
    after the viewport is computed), decorations produced by plugins
    are _not_ taken into account when predicting the vertical layout
    structure of the editor. Thus, things like large widgets or big
    replacements (i.e. code folding) should be provided through the
    state-level [`decorations` facet](https://codemirror.net/6/docs/ref/#view.EditorView^decorations),
    not this plugin field. Specifically, replacing decorations that
    cross line boundaries will break if provided through a plugin.
    */
    static decorations: PluginField<DecorationSet>;
    /**
    Used to provide ranges that should be treated as atoms as far as
    cursor motion is concerned. This causes methods like
    [`moveByChar`](https://codemirror.net/6/docs/ref/#view.EditorView.moveByChar) and
    [`moveVertically`](https://codemirror.net/6/docs/ref/#view.EditorView.moveVertically) (and the
    commands built on top of them) to skip across such regions when
    a selection endpoint would enter them. This does _not_ prevent
    direct programmatic [selection
    updates](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection) from moving into such
    regions.
    */
    static atomicRanges: PluginField<RangeSet<any>>;
    /**
    Plugins can provide additional scroll margins (space around the
    sides of the scrolling element that should be considered
    invisible) through this field. This can be useful when the
    plugin introduces elements that cover part of that element (for
    example a horizontally fixed gutter).
    */
    static scrollMargins: PluginField<Partial<Rect> | null>;
}
/**
Provides additional information when defining a [view
plugin](https://codemirror.net/6/docs/ref/#view.ViewPlugin).
*/
interface PluginSpec<V extends PluginValue> {
    /**
    Register the given [event
    handlers](https://codemirror.net/6/docs/ref/#view.EditorView^domEventHandlers) for the plugin.
    When called, these will have their `this` bound to the plugin
    value.
    */
    eventHandlers?: DOMEventHandlers<V>;
    /**
    Allow the plugin to provide decorations. When given, this should
    a function that take the plugin value and return a [decoration
    set](https://codemirror.net/6/docs/ref/#view.DecorationSet). See also the caveat about
    [layout-changing decorations](https://codemirror.net/6/docs/ref/#view.PluginField^decorations)
    from plugins.
    */
    decorations?: (value: V) => DecorationSet;
    /**
    Specify that the plugin provides [plugin
    field](https://codemirror.net/6/docs/ref/#view.PluginField) values. Use a field's
    [`from`](https://codemirror.net/6/docs/ref/#view.PluginField.from) method to create these
    providers.
    */
    provide?: PluginFieldProvider<V> | readonly PluginFieldProvider<V>[];
}
/**
View plugins associate stateful values with a view. They can
influence the way the content is drawn, and are notified of things
that happen in the view.
*/
declare class ViewPlugin<V extends PluginValue> {
    /**
    Instances of this class act as extensions.
    */
    extension: Extension;
    private constructor();
    /**
    Define a plugin from a constructor function that creates the
    plugin's value, given an editor view.
    */
    static define<V extends PluginValue>(create: (view: EditorView) => V, spec?: PluginSpec<V>): ViewPlugin<V>;
    /**
    Create a plugin for a class whose constructor takes a single
    editor view as argument.
    */
    static fromClass<V extends PluginValue>(cls: {
        new (view: EditorView): V;
    }, spec?: PluginSpec<V>): ViewPlugin<V>;
}
interface MeasureRequest<T> {
    /**
    Called in a DOM read phase to gather information that requires
    DOM layout. Should _not_ mutate the document.
    */
    read(view: EditorView): T;
    /**
    Called in a DOM write phase to update the document. Should _not_
    do anything that triggers DOM layout.
    */
    write(measure: T, view: EditorView): void;
    /**
    When multiple requests with the same key are scheduled, only the
    last one will actually be ran.
    */
    key?: any;
}
/**
View [plugins](https://codemirror.net/6/docs/ref/#view.ViewPlugin) are given instances of this
class, which describe what happened, whenever the view is updated.
*/
declare class ViewUpdate {
    /**
    The editor view that the update is associated with.
    */
    readonly view: EditorView;
    /**
    The new editor state.
    */
    readonly state: EditorState;
    /**
    The transactions involved in the update. May be empty.
    */
    readonly transactions: readonly Transaction[];
    /**
    The changes made to the document by this update.
    */
    readonly changes: ChangeSet;
    /**
    The previous editor state.
    */
    readonly startState: EditorState;
    /**
    Tells you whether the viewport changed in this update.
    */
    get viewportChanged(): boolean;
    /**
    Indicates whether the line height in the editor changed in this update.
    */
    get heightChanged(): boolean;
    /**
    Returns true when the document changed or the size of the editor
    or the lines or characters within it has changed.
    */
    get geometryChanged(): boolean;
    /**
    True when this update indicates a focus change.
    */
    get focusChanged(): boolean;
    /**
    Whether the document changed in this update.
    */
    get docChanged(): boolean;
    /**
    Whether the selection was explicitly set in this update.
    */
    get selectionSet(): boolean;
}

/**
Interface that objects registered with
[`EditorView.mouseSelectionStyle`](https://codemirror.net/6/docs/ref/#view.EditorView^mouseSelectionStyle)
must conform to.
*/
interface MouseSelectionStyle {
    /**
    Return a new selection for the mouse gesture that starts with
    the event that was originally given to the constructor, and ends
    with the event passed here. In case of a plain click, those may
    both be the `mousedown` event, in case of a drag gesture, the
    latest `mousemove` event will be passed.

    When `extend` is true, that means the new selection should, if
    possible, extend the start selection. If `multiple` is true, the
    new selection should be added to the original selection.
    */
    get: (curEvent: MouseEvent, extend: boolean, multiple: boolean) => EditorSelection;
    /**
    Called when the view is updated while the gesture is in
    progress. When the document changes, it may be necessary to map
    some data (like the original selection or start position)
    through the changes.

    This may return `true` to indicate that the `get` method should
    get queried again after the update, because something in the
    update could change its result. Be wary of infinite loops when
    using this (where `get` returns a new selection, which will
    trigger `update`, which schedules another `get` in response).
    */
    update: (update: ViewUpdate) => boolean | void;
}
declare type MakeSelectionStyle = (view: EditorView, event: MouseEvent) => MouseSelectionStyle | null;

/**
Used to indicate [text direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection).
*/
declare enum Direction {
    /**
    Left-to-right.
    */
    LTR = 0,
    /**
    Right-to-left.
    */
    RTL = 1
}
/**
Represents a contiguous range of text that has a single direction
(as in left-to-right or right-to-left).
*/
declare class BidiSpan {
    /**
    The start of the span (relative to the start of the line).
    */
    readonly from: number;
    /**
    The end of the span.
    */
    readonly to: number;
    /**
    The ["bidi
    level"](https://unicode.org/reports/tr9/#Basic_Display_Algorithm)
    of the span (in this context, 0 means
    left-to-right, 1 means right-to-left, 2 means left-to-right
    number inside right-to-left text).
    */
    readonly level: number;
    /**
    The direction of this span.
    */
    get dir(): Direction;
}

/**
Record used to represent information about a block-level element
in the editor view.
*/
declare class BlockInfo {
    /**
    The start of the element in the document.
    */
    readonly from: number;
    /**
    The length of the element.
    */
    readonly length: number;
    /**
    The top position of the element.
    */
    readonly top: number;
    /**
    Its height.
    */
    readonly height: number;
    /**
    The type of element this is. When querying lines, this may be
    an array of all the blocks that make up the line.
    */
    readonly type: BlockType | readonly BlockInfo[];
    /**
    The end of the element as a document position.
    */
    get to(): number;
    /**
    The bottom position of the element.
    */
    get bottom(): number;
}

interface EditorConfig {
    /**
    The view's initial state. Defaults to an extension-less state
    with an empty document.
    */
    state?: EditorState;
    /**
    If the view is going to be mounted in a shadow root or document
    other than the one held by the global variable `document` (the
    default), you should pass it here.
    */
    root?: Document | ShadowRoot;
    /**
    Override the transaction [dispatch
    function](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) for this editor view, which
    is the way updates get routed to the view. Your implementation,
    if provided, should probably call the view's [`update`
    method](https://codemirror.net/6/docs/ref/#view.EditorView.update).
    */
    dispatch?: (tr: Transaction) => void;
    /**
    When given, the editor is immediately appended to the given
    element on creation. (Otherwise, you'll have to place the view's
    [`dom`](https://codemirror.net/6/docs/ref/#view.EditorView.dom) element in the document yourself.)
    */
    parent?: Element | DocumentFragment;
}
/**
An editor view represents the editor's user interface. It holds
the editable DOM surface, and possibly other elements such as the
line number gutter. It handles events and dispatches state
transactions for editing actions.
*/
declare class EditorView {
    /**
    The current editor state.
    */
    get state(): EditorState;
    /**
    To be able to display large documents without consuming too much
    memory or overloading the browser, CodeMirror only draws the
    code that is visible (plus a margin around it) to the DOM. This
    property tells you the extent of the current drawn viewport, in
    document positions.
    */
    get viewport(): {
        from: number;
        to: number;
    };
    /**
    When there are, for example, large collapsed ranges in the
    viewport, its size can be a lot bigger than the actual visible
    content. Thus, if you are doing something like styling the
    content in the viewport, it is preferable to only do so for
    these ranges, which are the subset of the viewport that is
    actually drawn.
    */
    get visibleRanges(): readonly {
        from: number;
        to: number;
    }[];
    /**
    Returns false when the editor is entirely scrolled out of view
    or otherwise hidden.
    */
    get inView(): boolean;
    /**
    Indicates whether the user is currently composing text via
    [IME](https://en.wikipedia.org/wiki/Input_method).
    */
    get composing(): boolean;
    private _dispatch;
    /**
    The document or shadow root that the view lives in.
    */
    readonly root: DocumentOrShadowRoot;
    /**
    The DOM element that wraps the entire editor view.
    */
    readonly dom: HTMLElement;
    /**
    The DOM element that can be styled to scroll. (Note that it may
    not have been, so you can't assume this is scrollable.)
    */
    readonly scrollDOM: HTMLElement;
    /**
    The editable DOM element holding the editor content. You should
    not, usually, interact with this content directly though the
    DOM, since the editor will immediately undo most of the changes
    you make. Instead, [dispatch](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch)
    [transactions](https://codemirror.net/6/docs/ref/#state.Transaction) to modify content, and
    [decorations](https://codemirror.net/6/docs/ref/#view.Decoration) to style it.
    */
    readonly contentDOM: HTMLElement;
    private announceDOM;
    private plugins;
    private editorAttrs;
    private contentAttrs;
    private styleModules;
    private bidiCache;
    /**
    Construct a new view. You'll usually want to put `view.dom` into
    your document after creating a view, so that the user can see
    it.
    */
    constructor(
    /**
    Initialization options.
    */
    config?: EditorConfig);
    /**
    All regular editor state updates should go through this. It
    takes a transaction or transaction spec and updates the view to
    show the new state produced by that transaction. Its
    implementation can be overridden with an
    [option](https://codemirror.net/6/docs/ref/#view.EditorView.constructor^config.dispatch). This
    function is bound to the view instance, so it does not have to
    be called as a method.
    */
    dispatch(tr: Transaction): void;
    dispatch(...specs: TransactionSpec[]): void;
    /**
    Update the view for the given array of transactions. This will
    update the visible document and selection to match the state
    produced by the transactions, and notify view plugins of the
    change. You should usually call
    [`dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) instead, which uses this
    as a primitive.
    */
    update(transactions: readonly Transaction[]): void;
    /**
    Reset the view to the given state. (This will cause the entire
    document to be redrawn and all view plugins to be reinitialized,
    so you should probably only use it when the new state isn't
    derived from the old state. Otherwise, use
    [`dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) instead.)
    */
    setState(newState: EditorState): void;
    private updatePlugins;
    /**
    Get the CSS classes for the currently active editor themes.
    */
    get themeClasses(): string;
    private updateAttrs;
    private showAnnouncements;
    private mountStyles;
    private readMeasured;
    /**
    Schedule a layout measurement, optionally providing callbacks to
    do custom DOM measuring followed by a DOM write phase. Using
    this is preferable reading DOM layout directly from, for
    example, an event handler, because it'll make sure measuring and
    drawing done by other components is synchronized, avoiding
    unnecessary DOM layout computations.
    */
    requestMeasure<T>(request?: MeasureRequest<T>): void;
    /**
    Collect all values provided by the active plugins for a given
    field.
    */
    pluginField<T>(field: PluginField<T>): readonly T[];
    /**
    Get the value of a specific plugin, if present. Note that
    plugins that crash can be dropped from a view, so even when you
    know you registered a given plugin, it is recommended to check
    the return value of this method.
    */
    plugin<T>(plugin: ViewPlugin<T>): T | null;
    /**
    Find the line or block widget at the given vertical position.

    By default, this position is interpreted as a screen position,
    meaning `docTop` is set to the DOM top position of the editor
    content (forcing a layout). You can pass a different `docTop`
    value—for example 0 to interpret `height` as a document-relative
    position, or a precomputed document top
    (`view.contentDOM.getBoundingClientRect().top`) to limit layout
    queries.
    */
    blockAtHeight(height: number, docTop?: number): BlockInfo;
    /**
    Find information for the visual line (see
    [`visualLineAt`](https://codemirror.net/6/docs/ref/#view.EditorView.visualLineAt)) at the given
    vertical position. The resulting block info might hold another
    array of block info structs in its `type` field if this line
    consists of more than one block.

    Defaults to treating `height` as a screen position. See
    [`blockAtHeight`](https://codemirror.net/6/docs/ref/#view.EditorView.blockAtHeight) for the
    interpretation of the `docTop` parameter.
    */
    visualLineAtHeight(height: number, docTop?: number): BlockInfo;
    /**
    Iterate over the height information of the visual lines in the
    viewport. The heights of lines are reported relative to the
    given document top, which defaults to the screen position of the
    document (forcing a layout).
    */
    viewportLines(f: (line: BlockInfo) => void, docTop?: number): void;
    /**
    Find the extent and height of the visual line (a range delimited
    on both sides by either non-[hidden](https://codemirror.net/6/docs/ref/#view.Decoration^range)
    line breaks, or the start/end of the document) at the given position.

    Vertical positions are computed relative to the `docTop`
    argument, which defaults to 0 for this method. You can pass
    `view.contentDOM.getBoundingClientRect().top` here to get screen
    coordinates.
    */
    visualLineAt(pos: number, docTop?: number): BlockInfo;
    /**
    The editor's total content height.
    */
    get contentHeight(): number;
    /**
    Move a cursor position by [grapheme
    cluster](https://codemirror.net/6/docs/ref/#text.findClusterBreak). `forward` determines whether
    the motion is away from the line start, or towards it. Motion in
    bidirectional text is in visual order, in the editor's [text
    direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection). When the start
    position was the last one on the line, the returned position
    will be across the line break. If there is no further line, the
    original position is returned.

    By default, this method moves over a single cluster. The
    optional `by` argument can be used to move across more. It will
    be called with the first cluster as argument, and should return
    a predicate that determines, for each subsequent cluster,
    whether it should also be moved over.
    */
    moveByChar(start: SelectionRange, forward: boolean, by?: (initial: string) => (next: string) => boolean): SelectionRange;
    /**
    Move a cursor position across the next group of either
    [letters](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer) or non-letter
    non-whitespace characters.
    */
    moveByGroup(start: SelectionRange, forward: boolean): SelectionRange;
    /**
    Move to the next line boundary in the given direction. If
    `includeWrap` is true, line wrapping is on, and there is a
    further wrap point on the current line, the wrap point will be
    returned. Otherwise this function will return the start or end
    of the line.
    */
    moveToLineBoundary(start: SelectionRange, forward: boolean, includeWrap?: boolean): SelectionRange;
    /**
    Move a cursor position vertically. When `distance` isn't given,
    it defaults to moving to the next line (including wrapped
    lines). Otherwise, `distance` should provide a positive distance
    in pixels.

    When `start` has a
    [`goalColumn`](https://codemirror.net/6/docs/ref/#state.SelectionRange.goalColumn), the vertical
    motion will use that as a target horizontal position. Otherwise,
    the cursor's own horizontal position is used. The returned
    cursor will have its goal column set to whichever column was
    used.
    */
    moveVertically(start: SelectionRange, forward: boolean, distance?: number): SelectionRange;
    /**
    Scroll the given document position into view.
    */
    scrollPosIntoView(pos: number): void;
    /**
    Find the DOM parent node and offset (child offset if `node` is
    an element, character offset when it is a text node) at the
    given document position.
    */
    domAtPos(pos: number): {
        node: Node;
        offset: number;
    };
    /**
    Find the document position at the given DOM node. Can be useful
    for associating positions with DOM events. Will raise an error
    when `node` isn't part of the editor content.
    */
    posAtDOM(node: Node, offset?: number): number;
    /**
    Get the document position at the given screen coordinates.
    Returns null if no valid position could be found.
    */
    posAtCoords(coords: {
        x: number;
        y: number;
    }, precise: false): number;
    posAtCoords(coords: {
        x: number;
        y: number;
    }): number | null;
    /**
    Get the screen coordinates at the given document position.
    `side` determines whether the coordinates are based on the
    element before (-1) or after (1) the position (if no element is
    available on the given side, the method will transparently use
    another strategy to get reasonable coordinates).
    */
    coordsAtPos(pos: number, side?: -1 | 1): Rect | null;
    /**
    The default width of a character in the editor. May not
    accurately reflect the width of all characters (given variable
    width fonts or styling of invididual ranges).
    */
    get defaultCharacterWidth(): number;
    /**
    The default height of a line in the editor. May not be accurate
    for all lines.
    */
    get defaultLineHeight(): number;
    /**
    The text direction
    ([`direction`](https://developer.mozilla.org/en-US/docs/Web/CSS/direction)
    CSS property) of the editor.
    */
    get textDirection(): Direction;
    /**
    Whether this editor [wraps lines](https://codemirror.net/6/docs/ref/#view.EditorView.lineWrapping)
    (as determined by the
    [`white-space`](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
    CSS property of its content element).
    */
    get lineWrapping(): boolean;
    /**
    Returns the bidirectional text structure of the given line
    (which should be in the current document) as an array of span
    objects. The order of these spans matches the [text
    direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection)—if that is
    left-to-right, the leftmost spans come first, otherwise the
    rightmost spans come first.
    */
    bidiSpans(line: Line): readonly BidiSpan[];
    /**
    Check whether the editor has focus.
    */
    get hasFocus(): boolean;
    /**
    Put focus on the editor.
    */
    focus(): void;
    /**
    Clean up this editor view, removing its element from the
    document, unregistering event handlers, and notifying
    plugins. The view instance can no longer be used after
    calling this.
    */
    destroy(): void;
    /**
    Facet to add a [style
    module](https://github.com/marijnh/style-mod#documentation) to
    an editor view. The view will ensure that the module is
    mounted in its [document
    root](https://codemirror.net/6/docs/ref/#view.EditorView.constructor^config.root).
    */
    static styleModule: Facet<StyleModule, readonly StyleModule[]>;
    /**
    Facet that can be used to add DOM event handlers. The value
    should be an object mapping event names to handler functions. The
    first such function to return true will be assumed to have handled
    that event, and no other handlers or built-in behavior will be
    activated for it.
    These are registered on the [content
    element](https://codemirror.net/6/docs/ref/#view.EditorView.contentDOM), except for `scroll`
    handlers, which will be called any time the editor's [scroll
    element](https://codemirror.net/6/docs/ref/#view.EditorView.scrollDOM) or one of its parent nodes
    is scrolled.
    */
    static domEventHandlers(handlers: DOMEventHandlers<any>): Extension;
    /**
    An input handler can override the way changes to the editable
    DOM content are handled. Handlers are passed the document
    positions between which the change was found, and the new
    content. When one returns true, no further input handlers are
    called and the default behavior is prevented.
    */
    static inputHandler: Facet<(view: EditorView, from: number, to: number, text: string) => boolean, readonly ((view: EditorView, from: number, to: number, text: string) => boolean)[]>;
    /**
    Allows you to provide a function that should be called when the
    library catches an exception from an extension (mostly from view
    plugins, but may be used by other extensions to route exceptions
    from user-code-provided callbacks). This is mostly useful for
    debugging and logging. See [`logException`](https://codemirror.net/6/docs/ref/#view.logException).
    */
    static exceptionSink: Facet<(exception: any) => void, readonly ((exception: any) => void)[]>;
    /**
    A facet that can be used to register a function to be called
    every time the view updates.
    */
    static updateListener: Facet<(update: ViewUpdate) => void, readonly ((update: ViewUpdate) => void)[]>;
    /**
    Facet that controls whether the editor content is editable. When
    its highest-precedence value is `false`, editing is disabled,
    and the content element will no longer have its
    `contenteditable` attribute set to `true`. (Note that this
    doesn't affect API calls that change the editor content, even
    when those are bound to keys or buttons.)
    */
    static editable: Facet<boolean, boolean>;
    /**
    Allows you to influence the way mouse selection happens. The
    functions in this facet will be called for a `mousedown` event
    on the editor, and can return an object that overrides the way a
    selection is computed from that mouse click or drag.
    */
    static mouseSelectionStyle: Facet<MakeSelectionStyle, readonly MakeSelectionStyle[]>;
    /**
    Facet used to configure whether a given selection drag event
    should move or copy the selection. The given predicate will be
    called with the `mousedown` event, and can return `true` when
    the drag should move the content.
    */
    static dragMovesSelection: Facet<(event: MouseEvent) => boolean, readonly ((event: MouseEvent) => boolean)[]>;
    /**
    Facet used to configure whether a given selecting click adds
    a new range to the existing selection or replaces it entirely.
    */
    static clickAddsSelectionRange: Facet<(event: MouseEvent) => boolean, readonly ((event: MouseEvent) => boolean)[]>;
    /**
    A facet that determines which [decorations](https://codemirror.net/6/docs/ref/#view.Decoration)
    are shown in the view. See also [view
    plugins](https://codemirror.net/6/docs/ref/#view.EditorView^decorations), which have a separate
    mechanism for providing decorations.
    */
    static decorations: Facet<DecorationSet, readonly DecorationSet[]>;
    /**
    Create a theme extension. The first argument can be a
    [`style-mod`](https://github.com/marijnh/style-mod#documentation)
    style spec providing the styles for the theme. These will be
    prefixed with a generated class for the style.

    Because the selectors will be prefixed with a scope class, rule
    that directly match the editor's [wrapper
    element](https://codemirror.net/6/docs/ref/#view.EditorView.dom)—to which the scope class will be
    added—need to be explicitly differentiated by adding an `&` to
    the selector for that element—for example
    `&.cm-focused`.

    When `dark` is set to true, the theme will be marked as dark,
    which will cause the `&dark` rules from [base
    themes](https://codemirror.net/6/docs/ref/#view.EditorView^baseTheme) to be used (as opposed to
    `&light` when a light theme is active).
    */
    static theme(spec: {
        [selector: string]: StyleSpec;
    }, options?: {
        dark?: boolean;
    }): Extension;
    /**
    Create an extension that adds styles to the base theme. Like
    with [`theme`](https://codemirror.net/6/docs/ref/#view.EditorView^theme), use `&` to indicate the
    place of the editor wrapper element when directly targeting
    that. You can also use `&dark` or `&light` instead to only
    target editors with a dark or light theme.
    */
    static baseTheme(spec: {
        [selector: string]: StyleSpec;
    }): Extension;
    /**
    Facet that provides additional DOM attributes for the editor's
    editable DOM element.
    */
    static contentAttributes: Facet<Attrs, Attrs>;
    /**
    Facet that provides DOM attributes for the editor's outer
    element.
    */
    static editorAttributes: Facet<Attrs, Attrs>;
    /**
    An extension that enables line wrapping in the editor (by
    setting CSS `white-space` to `pre-wrap` in the content).
    */
    static lineWrapping: Extension;
    /**
    State effect used to include screen reader announcements in a
    transaction. These will be added to the DOM in a visually hidden
    element with `aria-live="polite"` set, and should be used to
    describe effects that are visually obvious but may not be
    noticed by screen reader users (such as moving to the next
    search match).
    */
    static announce: StateEffectType<string>;
}
/**
Helper type that maps event names to event object types, or the
`any` type for unknown events.
*/
interface DOMEventMap extends HTMLElementEventMap {
    [other: string]: any;
}
/**
Event handlers are specified with objects like this. For event
types known by TypeScript, this will infer the event argument type
to hold the appropriate event object type. For unknown events, it
is inferred to `any`, and should be explicitly set if you want type
checking.
*/
declare type DOMEventHandlers<This> = {
    [event in keyof DOMEventMap]?: (this: This, event: DOMEventMap[event], view: EditorView) => boolean | void;
};

/**
Key bindings associate key names with
[command](https://codemirror.net/6/docs/ref/#view.Command)-style functions.

Key names may be strings like `"Shift-Ctrl-Enter"`—a key identifier
prefixed with zero or more modifiers. Key identifiers are based on
the strings that can appear in
[`KeyEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
Use lowercase letters to refer to letter keys (or uppercase letters
if you want shift to be held). You may use `"Space"` as an alias
for the `" "` name.

Modifiers can be given in any order. `Shift-` (or `s-`), `Alt-` (or
`a-`), `Ctrl-` (or `c-` or `Control-`) and `Cmd-` (or `m-` or
`Meta-`) are recognized.

When a key binding contains multiple key names separated by
spaces, it represents a multi-stroke binding, which will fire when
the user presses the given keys after each other order.

You can use `Mod-` as a shorthand for `Cmd-` on Mac and `Ctrl-` on
other platforms. So `Mod-b` is `Ctrl-b` on Linux but `Cmd-b` on
macOS.
*/
interface KeyBinding {
    /**
    The key name to use for this binding. If the platform-specific
    property (`mac`, `win`, or `linux`) for the current platform is
    used as well in the binding, that one takes precedence. If `key`
    isn't defined and the platform-specific binding isn't either,
    a binding is ignored.
    */
    key?: string;
    /**
    Key to use specifically on macOS.
    */
    mac?: string;
    /**
    Key to use specifically on Windows.
    */
    win?: string;
    /**
    Key to use specifically on Linux.
    */
    linux?: string;
    /**
    The command to execute when this binding is triggered. When the
    command function returns `false`, further bindings will be tried
    for the key.
    */
    run: Command;
    /**
    When given, this defines a second binding, using the (possibly
    platform-specific) key name prefixed with `Shift-` to activate
    this command.
    */
    shift?: Command;
    /**
    By default, key bindings apply when focus is on the editor
    content (the `"editor"` scope). Some extensions, mostly those
    that define their own panels, might want to allow you to
    register bindings local to that panel. Such bindings should use
    a custom scope name. You may also set multiple scope names,
    separated by spaces.
    */
    scope?: string;
    /**
    When set to true (the default is false), this will always
    prevent the further handling for the bound key, even if the
    command(s) return false. This can be useful for cases where the
    native behavior of the key is annoying or irrelevant but the
    command doesn't always apply (such as, Mod-u for undo selection,
    which would cause the browser to view source instead when no
    selection can be undone).
    */
    preventDefault?: boolean;
}
/**
Facet used for registering keymaps.

You can add multiple keymaps to an editor. Their priorities
determine their precedence (the ones specified early or with high
priority get checked first). When a handler has returned `true`
for a given key, no further handlers are called.
*/
declare const keymap: Facet<readonly KeyBinding[], readonly (readonly KeyBinding[])[]>;
/**
Run the key handlers registered for a given scope. The event
object should be `"keydown"` event. Returns true if any of the
handlers handled it.
*/
declare function runScopeHandlers(view: EditorView, event: KeyboardEvent, scope: string): boolean;

declare type SelectionConfig = {
    /**
    The length of a full cursor blink cycle, in milliseconds.
    Defaults to 1200. Can be set to 0 to disable blinking.
    */
    cursorBlinkRate?: number;
    /**
    Whether to show a cursor for non-empty ranges. Defaults to
    true.
    */
    drawRangeCursor?: boolean;
};
/**
Returns an extension that hides the browser's native selection and
cursor, replacing the selection with a background behind the text
(with the `cm-selectionBackground` class), and the
cursors with elements overlaid over the code (using
`cm-cursor-primary` and `cm-cursor-secondary`).

This allows the editor to display secondary selection ranges, and
tends to produce a type of selection more in line with that users
expect in a text editor (the native selection styling will often
leave gaps between lines and won't fill the horizontal space after
a line when the selection continues past it).

It does have a performance cost, in that it requires an extra DOM
layout cycle for many updates (the selection is drawn based on DOM
layout information that's only available after laying out the
content).
*/
declare function drawSelection(config?: SelectionConfig): Extension;

interface SpecialCharConfig {
    /**
    An optional function that renders the placeholder elements.

    The `description` argument will be text that clarifies what the
    character is, which should be provided to screen readers (for
    example with the
    [`aria-label`](https://www.w3.org/TR/wai-aria/#aria-label)
    attribute) and optionally shown to the user in other ways (such
    as the
    [`title`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
    attribute).

    The given placeholder string is a suggestion for how to display
    the character visually.
    */
    render?: ((code: number, description: string | null, placeholder: string) => HTMLElement) | null;
    /**
    Regular expression that matches the special characters to
    highlight. Must have its 'g'/global flag set.
    */
    specialChars?: RegExp;
    /**
    Regular expression that can be used to add characters to the
    default set of characters to highlight.
    */
    addSpecialChars?: RegExp | null;
}
/**
Returns an extension that installs highlighting of special
characters.
*/
declare function highlightSpecialChars(
/**
Configuration options.
*/
config?: SpecialCharConfig): Extension;

/**
Mark lines that have a cursor on them with the `"cm-activeLine"`
DOM class.
*/
declare function highlightActiveLine(): Extension;

/**
Extension that enables a placeholder—a piece of example content
to show when the editor is empty.
*/
declare function placeholder(content: string | HTMLElement): Extension;

/**
Helper class used to make it easier to maintain decorations on
visible code that matches a given regular expression. To be used
in a [view plugin](https://codemirror.net/6/docs/ref/#view.ViewPlugin). Instances of this object
represent a matching configuration.
*/
declare class MatchDecorator {
    private regexp;
    private getDeco;
    private boundary;
    /**
    Create a decorator.
    */
    constructor(config: {
        /**
        The regular expression to match against the content. Will only
        be matched inside lines (not across them). Should have its 'g'
        flag set.
        */
        regexp: RegExp;
        /**
        The decoration to apply to matches, either directly or as a
        function of the match.
        */
        decoration: Decoration | ((match: RegExpExecArray, view: EditorView, pos: number) => Decoration);
        /**
        By default, changed lines are re-matched entirely. You can
        provide a boundary expression, which should match single
        character strings that can never occur in `regexp`, to reduce
        the amount of re-matching.
        */
        boundary?: RegExp;
    });
    /**
    Compute the full set of decorations for matches in the given
    view's viewport. You'll want to call this when initializing your
    plugin.
    */
    createDeco(view: EditorView): RangeSet<Decoration>;
    /**
    Update a set of decorations for a view update. `deco` _must_ be
    the set of decorations produced by _this_ `MatchDecorator` for
    the view state before the update.
    */
    updateDeco(update: ViewUpdate, deco: DecorationSet): DecorationSet;
    private updateRange;
}

type index_d$a_BidiSpan = BidiSpan;
declare const index_d$a_BidiSpan: typeof BidiSpan;
type index_d$a_BlockInfo = BlockInfo;
declare const index_d$a_BlockInfo: typeof BlockInfo;
type index_d$a_BlockType = BlockType;
declare const index_d$a_BlockType: typeof BlockType;
type index_d$a_Command = Command;
type index_d$a_DOMEventHandlers<_0> = DOMEventHandlers<_0>;
type index_d$a_DOMEventMap = DOMEventMap;
type index_d$a_Decoration = Decoration;
declare const index_d$a_Decoration: typeof Decoration;
type index_d$a_DecorationSet = DecorationSet;
type index_d$a_Direction = Direction;
declare const index_d$a_Direction: typeof Direction;
type index_d$a_EditorView = EditorView;
declare const index_d$a_EditorView: typeof EditorView;
type index_d$a_KeyBinding = KeyBinding;
type index_d$a_MatchDecorator = MatchDecorator;
declare const index_d$a_MatchDecorator: typeof MatchDecorator;
type index_d$a_MouseSelectionStyle = MouseSelectionStyle;
type index_d$a_PluginField<_0> = PluginField<_0>;
declare const index_d$a_PluginField: typeof PluginField;
type index_d$a_PluginFieldProvider<_0> = PluginFieldProvider<_0>;
declare const index_d$a_PluginFieldProvider: typeof PluginFieldProvider;
type index_d$a_PluginSpec<_0> = PluginSpec<_0>;
type index_d$a_PluginValue = PluginValue;
type index_d$a_Rect = Rect;
type index_d$a_ViewPlugin<_0> = ViewPlugin<_0>;
declare const index_d$a_ViewPlugin: typeof ViewPlugin;
type index_d$a_ViewUpdate = ViewUpdate;
declare const index_d$a_ViewUpdate: typeof ViewUpdate;
type index_d$a_WidgetType = WidgetType;
declare const index_d$a_WidgetType: typeof WidgetType;
declare const index_d$a_drawSelection: typeof drawSelection;
declare const index_d$a_highlightActiveLine: typeof highlightActiveLine;
declare const index_d$a_highlightSpecialChars: typeof highlightSpecialChars;
declare const index_d$a_keymap: typeof keymap;
declare const index_d$a_logException: typeof logException;
declare const index_d$a_placeholder: typeof placeholder;
declare const index_d$a_runScopeHandlers: typeof runScopeHandlers;
type index_d$a_Range<_0> = Range<_0>;
declare const index_d$a_Range: typeof Range;
declare namespace index_d$a {
  export {
    index_d$a_BidiSpan as BidiSpan,
    index_d$a_BlockInfo as BlockInfo,
    index_d$a_BlockType as BlockType,
    index_d$a_Command as Command,
    index_d$a_DOMEventHandlers as DOMEventHandlers,
    index_d$a_DOMEventMap as DOMEventMap,
    index_d$a_Decoration as Decoration,
    index_d$a_DecorationSet as DecorationSet,
    index_d$a_Direction as Direction,
    index_d$a_EditorView as EditorView,
    index_d$a_KeyBinding as KeyBinding,
    index_d$a_MatchDecorator as MatchDecorator,
    index_d$a_MouseSelectionStyle as MouseSelectionStyle,
    index_d$a_PluginField as PluginField,
    index_d$a_PluginFieldProvider as PluginFieldProvider,
    index_d$a_PluginSpec as PluginSpec,
    index_d$a_PluginValue as PluginValue,
    index_d$a_Rect as Rect,
    index_d$a_ViewPlugin as ViewPlugin,
    index_d$a_ViewUpdate as ViewUpdate,
    index_d$a_WidgetType as WidgetType,
    index_d$a_drawSelection as drawSelection,
    index_d$a_highlightActiveLine as highlightActiveLine,
    index_d$a_highlightSpecialChars as highlightSpecialChars,
    index_d$a_keymap as keymap,
    index_d$a_logException as logException,
    index_d$a_placeholder as placeholder,
    index_d$a_runScopeHandlers as runScopeHandlers,
    index_d$a_Range as Range,
  };
}

/**
Move the selection one character to the left (which is backward in
left-to-right text, forward in right-to-left text).
*/
declare const cursorCharLeft: Command;
/**
Move the selection one character to the right.
*/
declare const cursorCharRight: Command;
/**
Move the selection one character forward.
*/
declare const cursorCharForward: Command;
/**
Move the selection one character backward.
*/
declare const cursorCharBackward: Command;
/**
Move the selection across one group of word or non-word (but also
non-space) characters.
*/
declare const cursorGroupLeft: Command;
/**
Move the selection one group to the right.
*/
declare const cursorGroupRight: Command;
/**
Move the selection one group forward.
*/
declare const cursorGroupForward: Command;
/**
Move the selection one group backward.
*/
declare const cursorGroupBackward: Command;
/**
Move the cursor over the next syntactic element to the left.
*/
declare const cursorSyntaxLeft: Command;
/**
Move the cursor over the next syntactic element to the right.
*/
declare const cursorSyntaxRight: Command;
/**
Move the selection one line up.
*/
declare const cursorLineUp: Command;
/**
Move the selection one line down.
*/
declare const cursorLineDown: Command;
/**
Move the selection one page up.
*/
declare const cursorPageUp: Command;
/**
Move the selection one page down.
*/
declare const cursorPageDown: Command;
/**
Move the selection to the next line wrap point, or to the end of
the line if there isn't one left on this line.
*/
declare const cursorLineBoundaryForward: Command;
/**
Move the selection to previous line wrap point, or failing that to
the start of the line. If the line is indented, and the cursor
isn't already at the end of the indentation, this will move to the
end of the indentation instead of the start of the line.
*/
declare const cursorLineBoundaryBackward: Command;
/**
Move the selection to the start of the line.
*/
declare const cursorLineStart: Command;
/**
Move the selection to the end of the line.
*/
declare const cursorLineEnd: Command;
/**
Move the selection to the bracket matching the one it is currently
on, if any.
*/
declare const cursorMatchingBracket: StateCommand;
/**
Extend the selection to the bracket matching the one the selection
head is currently on, if any.
*/
declare const selectMatchingBracket: StateCommand;
/**
Move the selection head one character to the left, while leaving
the anchor in place.
*/
declare const selectCharLeft: Command;
/**
Move the selection head one character to the right.
*/
declare const selectCharRight: Command;
/**
Move the selection head one character forward.
*/
declare const selectCharForward: Command;
/**
Move the selection head one character backward.
*/
declare const selectCharBackward: Command;
/**
Move the selection head one [group](https://codemirror.net/6/docs/ref/#commands.cursorGroupLeft) to
the left.
*/
declare const selectGroupLeft: Command;
/**
Move the selection head one group to the right.
*/
declare const selectGroupRight: Command;
/**
Move the selection head one group forward.
*/
declare const selectGroupForward: Command;
/**
Move the selection head one group backward.
*/
declare const selectGroupBackward: Command;
/**
Move the selection head over the next syntactic element to the left.
*/
declare const selectSyntaxLeft: Command;
/**
Move the selection head over the next syntactic element to the right.
*/
declare const selectSyntaxRight: Command;
/**
Move the selection head one line up.
*/
declare const selectLineUp: Command;
/**
Move the selection head one line down.
*/
declare const selectLineDown: Command;
/**
Move the selection head one page up.
*/
declare const selectPageUp: Command;
/**
Move the selection head one page down.
*/
declare const selectPageDown: Command;
/**
Move the selection head to the next line boundary.
*/
declare const selectLineBoundaryForward: Command;
/**
Move the selection head to the previous line boundary.
*/
declare const selectLineBoundaryBackward: Command;
/**
Move the selection head to the start of the line.
*/
declare const selectLineStart: Command;
/**
Move the selection head to the end of the line.
*/
declare const selectLineEnd: Command;
/**
Move the selection to the start of the document.
*/
declare const cursorDocStart: StateCommand;
/**
Move the selection to the end of the document.
*/
declare const cursorDocEnd: StateCommand;
/**
Move the selection head to the start of the document.
*/
declare const selectDocStart: StateCommand;
/**
Move the selection head to the end of the document.
*/
declare const selectDocEnd: StateCommand;
/**
Select the entire document.
*/
declare const selectAll: StateCommand;
/**
Expand the selection to cover entire lines.
*/
declare const selectLine: StateCommand;
/**
Select the next syntactic construct that is larger than the
selection. Note that this will only work insofar as the language
[provider](https://codemirror.net/6/docs/ref/#language.language) you use builds up a full
syntax tree.
*/
declare const selectParentSyntax: StateCommand;
/**
Simplify the current selection. When multiple ranges are selected,
reduce it to its main range. Otherwise, if the selection is
non-empty, convert it to a cursor selection.
*/
declare const simplifySelection: StateCommand;
/**
Delete the selection, or, for cursor selections, the character
before the cursor.
*/
declare const deleteCharBackward: Command;
/**
Delete the selection or the character after the cursor.
*/
declare const deleteCharForward: Command;
/**
Delete the selection or backward until the end of the next
[group](https://codemirror.net/6/docs/ref/#view.EditorView.moveByGroup), only skipping groups of
whitespace when they consist of a single space.
*/
declare const deleteGroupBackward: StateCommand;
/**
Delete the selection or forward until the end of the next group.
*/
declare const deleteGroupForward: StateCommand;
/**
Delete the selection, or, if it is a cursor selection, delete to
the end of the line. If the cursor is directly at the end of the
line, delete the line break after it.
*/
declare const deleteToLineEnd: Command;
/**
Delete the selection, or, if it is a cursor selection, delete to
the start of the line. If the cursor is directly at the start of the
line, delete the line break before it.
*/
declare const deleteToLineStart: Command;
/**
Delete all whitespace directly before a line end from the
document.
*/
declare const deleteTrailingWhitespace: StateCommand;
/**
Replace each selection range with a line break, leaving the cursor
on the line before the break.
*/
declare const splitLine: StateCommand;
/**
Flip the characters before and after the cursor(s).
*/
declare const transposeChars: StateCommand;
/**
Move the selected lines up one line.
*/
declare const moveLineUp: StateCommand;
/**
Move the selected lines down one line.
*/
declare const moveLineDown: StateCommand;
/**
Create a copy of the selected lines. Keep the selection in the top copy.
*/
declare const copyLineUp: StateCommand;
/**
Create a copy of the selected lines. Keep the selection in the bottom copy.
*/
declare const copyLineDown: StateCommand;
/**
Delete selected lines.
*/
declare const deleteLine: Command;
/**
Replace the selection with a newline.
*/
declare const insertNewline: StateCommand;
/**
Replace the selection with a newline and indent the newly created
line(s). If the current line consists only of whitespace, this
will also delete that whitespace. When the cursor is between
matching brackets, an additional newline will be inserted after
the cursor.
*/
declare const insertNewlineAndIndent: StateCommand;
/**
Auto-indent the selected lines. This uses the [indentation service
facet](https://codemirror.net/6/docs/ref/#language.indentService) as source for auto-indent
information.
*/
declare const indentSelection: StateCommand;
/**
Add a [unit](https://codemirror.net/6/docs/ref/#language.indentUnit) of indentation to all selected
lines.
*/
declare const indentMore: StateCommand;
/**
Remove a [unit](https://codemirror.net/6/docs/ref/#language.indentUnit) of indentation from all
selected lines.
*/
declare const indentLess: StateCommand;
/**
Insert a tab character at the cursor or, if something is selected,
use [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore) to indent the entire
selection.
*/
declare const insertTab: StateCommand;
/**
Array of key bindings containing the Emacs-style bindings that are
available on macOS by default.

 - Ctrl-b: [`cursorCharLeft`](https://codemirror.net/6/docs/ref/#commands.cursorCharLeft) ([`selectCharLeft`](https://codemirror.net/6/docs/ref/#commands.selectCharLeft) with Shift)
 - Ctrl-f: [`cursorCharRight`](https://codemirror.net/6/docs/ref/#commands.cursorCharRight) ([`selectCharRight`](https://codemirror.net/6/docs/ref/#commands.selectCharRight) with Shift)
 - Ctrl-p: [`cursorLineUp`](https://codemirror.net/6/docs/ref/#commands.cursorLineUp) ([`selectLineUp`](https://codemirror.net/6/docs/ref/#commands.selectLineUp) with Shift)
 - Ctrl-n: [`cursorLineDown`](https://codemirror.net/6/docs/ref/#commands.cursorLineDown) ([`selectLineDown`](https://codemirror.net/6/docs/ref/#commands.selectLineDown) with Shift)
 - Ctrl-a: [`cursorLineStart`](https://codemirror.net/6/docs/ref/#commands.cursorLineStart) ([`selectLineStart`](https://codemirror.net/6/docs/ref/#commands.selectLineStart) with Shift)
 - Ctrl-e: [`cursorLineEnd`](https://codemirror.net/6/docs/ref/#commands.cursorLineEnd) ([`selectLineEnd`](https://codemirror.net/6/docs/ref/#commands.selectLineEnd) with Shift)
 - Ctrl-d: [`deleteCharForward`](https://codemirror.net/6/docs/ref/#commands.deleteCharForward)
 - Ctrl-h: [`deleteCharBackward`](https://codemirror.net/6/docs/ref/#commands.deleteCharBackward)
 - Ctrl-k: [`deleteToLineEnd`](https://codemirror.net/6/docs/ref/#commands.deleteToLineEnd)
 - Ctrl-Alt-h: [`deleteGroupBackward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupBackward)
 - Ctrl-o: [`splitLine`](https://codemirror.net/6/docs/ref/#commands.splitLine)
 - Ctrl-t: [`transposeChars`](https://codemirror.net/6/docs/ref/#commands.transposeChars)
 - Alt-<: [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart)
 - Alt->: [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd)
 - Ctrl-v: [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown)
 - Alt-v: [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp)
*/
declare const emacsStyleKeymap: readonly KeyBinding[];
/**
An array of key bindings closely sticking to platform-standard or
widely used bindings. (This includes the bindings from
[`emacsStyleKeymap`](https://codemirror.net/6/docs/ref/#commands.emacsStyleKeymap), with their `key`
property changed to `mac`.)

 - ArrowLeft: [`cursorCharLeft`](https://codemirror.net/6/docs/ref/#commands.cursorCharLeft) ([`selectCharLeft`](https://codemirror.net/6/docs/ref/#commands.selectCharLeft) with Shift)
 - ArrowRight: [`cursorCharRight`](https://codemirror.net/6/docs/ref/#commands.cursorCharRight) ([`selectCharRight`](https://codemirror.net/6/docs/ref/#commands.selectCharRight) with Shift)
 - Ctrl-ArrowLeft (Alt-ArrowLeft on macOS): [`cursorGroupLeft`](https://codemirror.net/6/docs/ref/#commands.cursorGroupLeft) ([`selectGroupLeft`](https://codemirror.net/6/docs/ref/#commands.selectGroupLeft) with Shift)
 - Ctrl-ArrowRight (Alt-ArrowRight on macOS): [`cursorGroupRight`](https://codemirror.net/6/docs/ref/#commands.cursorGroupRight) ([`selectGroupRight`](https://codemirror.net/6/docs/ref/#commands.selectGroupRight) with Shift)
 - Cmd-ArrowLeft (on macOS): [`cursorLineStart`](https://codemirror.net/6/docs/ref/#commands.cursorLineStart) ([`selectLineStart`](https://codemirror.net/6/docs/ref/#commands.selectLineStart) with Shift)
 - Cmd-ArrowRight (on macOS): [`cursorLineEnd`](https://codemirror.net/6/docs/ref/#commands.cursorLineEnd) ([`selectLineEnd`](https://codemirror.net/6/docs/ref/#commands.selectLineEnd) with Shift)
 - ArrowUp: [`cursorLineUp`](https://codemirror.net/6/docs/ref/#commands.cursorLineUp) ([`selectLineUp`](https://codemirror.net/6/docs/ref/#commands.selectLineUp) with Shift)
 - ArrowDown: [`cursorLineDown`](https://codemirror.net/6/docs/ref/#commands.cursorLineDown) ([`selectLineDown`](https://codemirror.net/6/docs/ref/#commands.selectLineDown) with Shift)
 - Cmd-ArrowUp (on macOS): [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart) ([`selectDocStart`](https://codemirror.net/6/docs/ref/#commands.selectDocStart) with Shift)
 - Cmd-ArrowDown (on macOS): [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd) ([`selectDocEnd`](https://codemirror.net/6/docs/ref/#commands.selectDocEnd) with Shift)
 - Ctrl-ArrowUp (on macOS): [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp) ([`selectPageUp`](https://codemirror.net/6/docs/ref/#commands.selectPageUp) with Shift)
 - Ctrl-ArrowDown (on macOS): [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown) ([`selectPageDown`](https://codemirror.net/6/docs/ref/#commands.selectPageDown) with Shift)
 - PageUp: [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp) ([`selectPageUp`](https://codemirror.net/6/docs/ref/#commands.selectPageUp) with Shift)
 - PageDown: [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown) ([`selectPageDown`](https://codemirror.net/6/docs/ref/#commands.selectPageDown) with Shift)
 - Home: [`cursorLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.cursorLineBoundaryBackward) ([`selectLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.selectLineBoundaryBackward) with Shift)
 - End: [`cursorLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.cursorLineBoundaryForward) ([`selectLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.selectLineBoundaryForward) with Shift)
 - Ctrl-Home (Cmd-Home on macOS): [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart) ([`selectDocStart`](https://codemirror.net/6/docs/ref/#commands.selectDocStart) with Shift)
 - Ctrl-End (Cmd-Home on macOS): [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd) ([`selectDocEnd`](https://codemirror.net/6/docs/ref/#commands.selectDocEnd) with Shift)
 - Enter: [`insertNewlineAndIndent`](https://codemirror.net/6/docs/ref/#commands.insertNewlineAndIndent)
 - Ctrl-a (Cmd-a on macOS): [`selectAll`](https://codemirror.net/6/docs/ref/#commands.selectAll)
 - Backspace: [`deleteCharBackward`](https://codemirror.net/6/docs/ref/#commands.deleteCharBackward)
 - Delete: [`deleteCharForward`](https://codemirror.net/6/docs/ref/#commands.deleteCharForward)
 - Ctrl-Backspace (Alt-Backspace on macOS): [`deleteGroupBackward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupBackward)
 - Ctrl-Delete (Alt-Delete on macOS): [`deleteGroupForward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupForward)
 - Cmd-Backspace (macOS): [`deleteToLineStart`](https://codemirror.net/6/docs/ref/#commands.deleteToLineStart).
 - Cmd-Delete (macOS): [`deleteToLineEnd`](https://codemirror.net/6/docs/ref/#commands.deleteToLineEnd).
*/
declare const standardKeymap: readonly KeyBinding[];
/**
The default keymap. Includes all bindings from
[`standardKeymap`](https://codemirror.net/6/docs/ref/#commands.standardKeymap) plus the following:

- Alt-ArrowLeft (Ctrl-ArrowLeft on macOS): [`cursorSyntaxLeft`](https://codemirror.net/6/docs/ref/#commands.cursorSyntaxLeft) ([`selectSyntaxLeft`](https://codemirror.net/6/docs/ref/#commands.selectSyntaxLeft) with Shift)
- Alt-ArrowRight (Ctrl-ArrowRight on macOS): [`cursorSyntaxRight`](https://codemirror.net/6/docs/ref/#commands.cursorSyntaxRight) ([`selectSyntaxRight`](https://codemirror.net/6/docs/ref/#commands.selectSyntaxRight) with Shift)
- Alt-ArrowUp: [`moveLineUp`](https://codemirror.net/6/docs/ref/#commands.moveLineUp)
- Alt-ArrowDown: [`moveLineDown`](https://codemirror.net/6/docs/ref/#commands.moveLineDown)
- Shift-Alt-ArrowUp: [`copyLineUp`](https://codemirror.net/6/docs/ref/#commands.copyLineUp)
- Shift-Alt-ArrowDown: [`copyLineDown`](https://codemirror.net/6/docs/ref/#commands.copyLineDown)
- Escape: [`simplifySelection`](https://codemirror.net/6/docs/ref/#commands.simplifySelection)
- Alt-l (Ctrl-l on macOS): [`selectLine`](https://codemirror.net/6/docs/ref/#commands.selectLine)
- Ctrl-i (Cmd-i on macOS): [`selectParentSyntax`](https://codemirror.net/6/docs/ref/#commands.selectParentSyntax)
- Ctrl-[ (Cmd-[ on macOS): [`indentLess`](https://codemirror.net/6/docs/ref/#commands.indentLess)
- Ctrl-] (Cmd-] on macOS): [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore)
- Ctrl-Alt-\\ (Cmd-Alt-\\ on macOS): [`indentSelection`](https://codemirror.net/6/docs/ref/#commands.indentSelection)
- Shift-Ctrl-k (Shift-Cmd-k on macOS): [`deleteLine`](https://codemirror.net/6/docs/ref/#commands.deleteLine)
- Shift-Ctrl-\\ (Shift-Cmd-\\ on macOS): [`cursorMatchingBracket`](https://codemirror.net/6/docs/ref/#commands.cursorMatchingBracket)
*/
declare const defaultKeymap: readonly KeyBinding[];
/**
A binding that binds Tab to [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore) and
Shift-Tab to [`indentLess`](https://codemirror.net/6/docs/ref/#commands.indentLess).
Please see the [Tab example](../../examples/tab/) before using
this.
*/
declare const indentWithTab: KeyBinding;

declare const index_d$9_copyLineDown: typeof copyLineDown;
declare const index_d$9_copyLineUp: typeof copyLineUp;
declare const index_d$9_cursorCharBackward: typeof cursorCharBackward;
declare const index_d$9_cursorCharForward: typeof cursorCharForward;
declare const index_d$9_cursorCharLeft: typeof cursorCharLeft;
declare const index_d$9_cursorCharRight: typeof cursorCharRight;
declare const index_d$9_cursorDocEnd: typeof cursorDocEnd;
declare const index_d$9_cursorDocStart: typeof cursorDocStart;
declare const index_d$9_cursorGroupBackward: typeof cursorGroupBackward;
declare const index_d$9_cursorGroupForward: typeof cursorGroupForward;
declare const index_d$9_cursorGroupLeft: typeof cursorGroupLeft;
declare const index_d$9_cursorGroupRight: typeof cursorGroupRight;
declare const index_d$9_cursorLineBoundaryBackward: typeof cursorLineBoundaryBackward;
declare const index_d$9_cursorLineBoundaryForward: typeof cursorLineBoundaryForward;
declare const index_d$9_cursorLineDown: typeof cursorLineDown;
declare const index_d$9_cursorLineEnd: typeof cursorLineEnd;
declare const index_d$9_cursorLineStart: typeof cursorLineStart;
declare const index_d$9_cursorLineUp: typeof cursorLineUp;
declare const index_d$9_cursorMatchingBracket: typeof cursorMatchingBracket;
declare const index_d$9_cursorPageDown: typeof cursorPageDown;
declare const index_d$9_cursorPageUp: typeof cursorPageUp;
declare const index_d$9_cursorSyntaxLeft: typeof cursorSyntaxLeft;
declare const index_d$9_cursorSyntaxRight: typeof cursorSyntaxRight;
declare const index_d$9_defaultKeymap: typeof defaultKeymap;
declare const index_d$9_deleteCharBackward: typeof deleteCharBackward;
declare const index_d$9_deleteCharForward: typeof deleteCharForward;
declare const index_d$9_deleteGroupBackward: typeof deleteGroupBackward;
declare const index_d$9_deleteGroupForward: typeof deleteGroupForward;
declare const index_d$9_deleteLine: typeof deleteLine;
declare const index_d$9_deleteToLineEnd: typeof deleteToLineEnd;
declare const index_d$9_deleteToLineStart: typeof deleteToLineStart;
declare const index_d$9_deleteTrailingWhitespace: typeof deleteTrailingWhitespace;
declare const index_d$9_emacsStyleKeymap: typeof emacsStyleKeymap;
declare const index_d$9_indentLess: typeof indentLess;
declare const index_d$9_indentMore: typeof indentMore;
declare const index_d$9_indentSelection: typeof indentSelection;
declare const index_d$9_indentWithTab: typeof indentWithTab;
declare const index_d$9_insertNewline: typeof insertNewline;
declare const index_d$9_insertNewlineAndIndent: typeof insertNewlineAndIndent;
declare const index_d$9_insertTab: typeof insertTab;
declare const index_d$9_moveLineDown: typeof moveLineDown;
declare const index_d$9_moveLineUp: typeof moveLineUp;
declare const index_d$9_selectAll: typeof selectAll;
declare const index_d$9_selectCharBackward: typeof selectCharBackward;
declare const index_d$9_selectCharForward: typeof selectCharForward;
declare const index_d$9_selectCharLeft: typeof selectCharLeft;
declare const index_d$9_selectCharRight: typeof selectCharRight;
declare const index_d$9_selectDocEnd: typeof selectDocEnd;
declare const index_d$9_selectDocStart: typeof selectDocStart;
declare const index_d$9_selectGroupBackward: typeof selectGroupBackward;
declare const index_d$9_selectGroupForward: typeof selectGroupForward;
declare const index_d$9_selectGroupLeft: typeof selectGroupLeft;
declare const index_d$9_selectGroupRight: typeof selectGroupRight;
declare const index_d$9_selectLine: typeof selectLine;
declare const index_d$9_selectLineBoundaryBackward: typeof selectLineBoundaryBackward;
declare const index_d$9_selectLineBoundaryForward: typeof selectLineBoundaryForward;
declare const index_d$9_selectLineDown: typeof selectLineDown;
declare const index_d$9_selectLineEnd: typeof selectLineEnd;
declare const index_d$9_selectLineStart: typeof selectLineStart;
declare const index_d$9_selectLineUp: typeof selectLineUp;
declare const index_d$9_selectMatchingBracket: typeof selectMatchingBracket;
declare const index_d$9_selectPageDown: typeof selectPageDown;
declare const index_d$9_selectPageUp: typeof selectPageUp;
declare const index_d$9_selectParentSyntax: typeof selectParentSyntax;
declare const index_d$9_selectSyntaxLeft: typeof selectSyntaxLeft;
declare const index_d$9_selectSyntaxRight: typeof selectSyntaxRight;
declare const index_d$9_simplifySelection: typeof simplifySelection;
declare const index_d$9_splitLine: typeof splitLine;
declare const index_d$9_standardKeymap: typeof standardKeymap;
declare const index_d$9_transposeChars: typeof transposeChars;
declare namespace index_d$9 {
  export {
    index_d$9_copyLineDown as copyLineDown,
    index_d$9_copyLineUp as copyLineUp,
    index_d$9_cursorCharBackward as cursorCharBackward,
    index_d$9_cursorCharForward as cursorCharForward,
    index_d$9_cursorCharLeft as cursorCharLeft,
    index_d$9_cursorCharRight as cursorCharRight,
    index_d$9_cursorDocEnd as cursorDocEnd,
    index_d$9_cursorDocStart as cursorDocStart,
    index_d$9_cursorGroupBackward as cursorGroupBackward,
    index_d$9_cursorGroupForward as cursorGroupForward,
    index_d$9_cursorGroupLeft as cursorGroupLeft,
    index_d$9_cursorGroupRight as cursorGroupRight,
    index_d$9_cursorLineBoundaryBackward as cursorLineBoundaryBackward,
    index_d$9_cursorLineBoundaryForward as cursorLineBoundaryForward,
    index_d$9_cursorLineDown as cursorLineDown,
    index_d$9_cursorLineEnd as cursorLineEnd,
    index_d$9_cursorLineStart as cursorLineStart,
    index_d$9_cursorLineUp as cursorLineUp,
    index_d$9_cursorMatchingBracket as cursorMatchingBracket,
    index_d$9_cursorPageDown as cursorPageDown,
    index_d$9_cursorPageUp as cursorPageUp,
    index_d$9_cursorSyntaxLeft as cursorSyntaxLeft,
    index_d$9_cursorSyntaxRight as cursorSyntaxRight,
    index_d$9_defaultKeymap as defaultKeymap,
    index_d$9_deleteCharBackward as deleteCharBackward,
    index_d$9_deleteCharForward as deleteCharForward,
    index_d$9_deleteGroupBackward as deleteGroupBackward,
    index_d$9_deleteGroupForward as deleteGroupForward,
    index_d$9_deleteLine as deleteLine,
    index_d$9_deleteToLineEnd as deleteToLineEnd,
    index_d$9_deleteToLineStart as deleteToLineStart,
    index_d$9_deleteTrailingWhitespace as deleteTrailingWhitespace,
    index_d$9_emacsStyleKeymap as emacsStyleKeymap,
    index_d$9_indentLess as indentLess,
    index_d$9_indentMore as indentMore,
    index_d$9_indentSelection as indentSelection,
    index_d$9_indentWithTab as indentWithTab,
    index_d$9_insertNewline as insertNewline,
    index_d$9_insertNewlineAndIndent as insertNewlineAndIndent,
    index_d$9_insertTab as insertTab,
    index_d$9_moveLineDown as moveLineDown,
    index_d$9_moveLineUp as moveLineUp,
    index_d$9_selectAll as selectAll,
    index_d$9_selectCharBackward as selectCharBackward,
    index_d$9_selectCharForward as selectCharForward,
    index_d$9_selectCharLeft as selectCharLeft,
    index_d$9_selectCharRight as selectCharRight,
    index_d$9_selectDocEnd as selectDocEnd,
    index_d$9_selectDocStart as selectDocStart,
    index_d$9_selectGroupBackward as selectGroupBackward,
    index_d$9_selectGroupForward as selectGroupForward,
    index_d$9_selectGroupLeft as selectGroupLeft,
    index_d$9_selectGroupRight as selectGroupRight,
    index_d$9_selectLine as selectLine,
    index_d$9_selectLineBoundaryBackward as selectLineBoundaryBackward,
    index_d$9_selectLineBoundaryForward as selectLineBoundaryForward,
    index_d$9_selectLineDown as selectLineDown,
    index_d$9_selectLineEnd as selectLineEnd,
    index_d$9_selectLineStart as selectLineStart,
    index_d$9_selectLineUp as selectLineUp,
    index_d$9_selectMatchingBracket as selectMatchingBracket,
    index_d$9_selectPageDown as selectPageDown,
    index_d$9_selectPageUp as selectPageUp,
    index_d$9_selectParentSyntax as selectParentSyntax,
    index_d$9_selectSyntaxLeft as selectSyntaxLeft,
    index_d$9_selectSyntaxRight as selectSyntaxRight,
    index_d$9_simplifySelection as simplifySelection,
    index_d$9_splitLine as splitLine,
    index_d$9_standardKeymap as standardKeymap,
    index_d$9_transposeChars as transposeChars,
  };
}

/**
Configures bracket closing behavior for a syntax (via
[language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt)) using the `"closeBrackets"`
identifier.
*/
interface CloseBracketConfig {
    /**
    The opening brackets to close. Defaults to `["(", "[", "{", "'",
    '"']`. Brackets may be single characters or a triple of quotes
    (as in `"''''"`).
    */
    brackets?: string[];
    /**
    Characters in front of which newly opened brackets are
    automatically closed. Closing always happens in front of
    whitespace. Defaults to `")]}'\":;>"`.
    */
    before?: string;
}
/**
Extension to enable bracket-closing behavior. When a closeable
bracket is typed, its closing bracket is immediately inserted
after the cursor. When closing a bracket directly in front of a
closing bracket inserted by the extension, the cursor moves over
that bracket.
*/
declare function closeBrackets(): Extension;
/**
Command that implements deleting a pair of matching brackets when
the cursor is between them.
*/
declare const deleteBracketPair: StateCommand;
/**
Close-brackets related key bindings. Binds Backspace to
[`deleteBracketPair`](https://codemirror.net/6/docs/ref/#closebrackets.deleteBracketPair).
*/
declare const closeBracketsKeymap: readonly KeyBinding[];
/**
Implements the extension's behavior on text insertion. If the
given string counts as a bracket in the language around the
selection, and replacing the selection with it requires custom
behavior (inserting a closing version or skipping past a
previously-closed bracket), this function returns a transaction
representing that custom behavior. (You only need this if you want
to programmatically insert brackets—the
[`closeBrackets`](https://codemirror.net/6/docs/ref/#closebrackets.closeBrackets) extension will
take care of running this for user input.)
*/
declare function insertBracket(state: EditorState, bracket: string): Transaction | null;

type index_d$8_CloseBracketConfig = CloseBracketConfig;
declare const index_d$8_closeBrackets: typeof closeBrackets;
declare const index_d$8_closeBracketsKeymap: typeof closeBracketsKeymap;
declare const index_d$8_deleteBracketPair: typeof deleteBracketPair;
declare const index_d$8_insertBracket: typeof insertBracket;
declare namespace index_d$8 {
  export {
    index_d$8_CloseBracketConfig as CloseBracketConfig,
    index_d$8_closeBrackets as closeBrackets,
    index_d$8_closeBracketsKeymap as closeBracketsKeymap,
    index_d$8_deleteBracketPair as deleteBracketPair,
    index_d$8_insertBracket as insertBracket,
  };
}

/**
A gutter marker represents a bit of information attached to a line
in a specific gutter. Your own custom markers have to extend this
class.
*/
declare abstract class GutterMarker extends RangeValue {
    /**
    Compare this marker to another marker of the same type.
    */
    eq(other: GutterMarker): boolean;
    /**
    Render the DOM node for this marker, if any.
    */
    toDOM?(_view: EditorView): Node;
    /**
    This property can be used to add CSS classes to the gutter
    element that contains this marker.
    */
    elementClass: string;
}
/**
Facet used to add a class to all gutter elements for a given line.
Markers given to this facet should _only_ define an
[`elementclass`](https://codemirror.net/6/docs/ref/#gutter.GutterMarker.elementClass), not a
[`toDOM`](https://codemirror.net/6/docs/ref/#gutter.GutterMarker.toDOM) (or the marker will appear
in all gutters for the line).
*/
declare const gutterLineClass: Facet<RangeSet<GutterMarker>, readonly RangeSet<GutterMarker>[]>;
declare type Handlers = {
    [event: string]: (view: EditorView, line: BlockInfo, event: Event) => boolean;
};
interface GutterConfig {
    /**
    An extra CSS class to be added to the wrapper (`cm-gutter`)
    element.
    */
    class?: string;
    /**
    Controls whether empty gutter elements should be rendered.
    Defaults to false.
    */
    renderEmptyElements?: boolean;
    /**
    Retrieve a set of markers to use in this gutter.
    */
    markers?: (view: EditorView) => (RangeSet<GutterMarker> | readonly RangeSet<GutterMarker>[]);
    /**
    Can be used to optionally add a single marker to every line.
    */
    lineMarker?: (view: EditorView, line: BlockInfo, otherMarkers: readonly GutterMarker[]) => GutterMarker | null;
    /**
    Add a hidden spacer element that gives the gutter its base
    width.
    */
    initialSpacer?: null | ((view: EditorView) => GutterMarker);
    /**
    Update the spacer element when the view is updated.
    */
    updateSpacer?: null | ((spacer: GutterMarker, update: ViewUpdate) => GutterMarker);
    /**
    Supply event handlers for DOM events on this gutter.
    */
    domEventHandlers?: Handlers;
}
/**
Define an editor gutter. The order in which the gutters appear is
determined by their extension priority.
*/
declare function gutter(config: GutterConfig): Extension;
/**
The gutter-drawing plugin is automatically enabled when you add a
gutter, but you can use this function to explicitly configure it.

Unless `fixed` is explicitly set to `false`, the gutters are
fixed, meaning they don't scroll along with the content
horizontally (except on Internet Explorer, which doesn't support
CSS [`position:
sticky`](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky)).
*/
declare function gutters(config?: {
    fixed?: boolean;
}): Extension;
interface LineNumberConfig {
    /**
    How to display line numbers. Defaults to simply converting them
    to string.
    */
    formatNumber?: (lineNo: number, state: EditorState) => string;
    /**
    Supply event handlers for DOM events on this gutter.
    */
    domEventHandlers?: Handlers;
}
/**
Facet used to provide markers to the line number gutter.
*/
declare const lineNumberMarkers: Facet<RangeSet<GutterMarker>, readonly RangeSet<GutterMarker>[]>;
/**
Create a line number gutter extension.
*/
declare function lineNumbers(config?: LineNumberConfig): Extension;
/**
Returns an extension that adds a `cm-activeLineGutter` class to
all gutter elements on the [active
line](https://codemirror.net/6/docs/ref/#view.highlightActiveLine).
*/
declare function highlightActiveLineGutter(): Extension;

type index_d$7_GutterMarker = GutterMarker;
declare const index_d$7_GutterMarker: typeof GutterMarker;
declare const index_d$7_gutter: typeof gutter;
declare const index_d$7_gutterLineClass: typeof gutterLineClass;
declare const index_d$7_gutters: typeof gutters;
declare const index_d$7_highlightActiveLineGutter: typeof highlightActiveLineGutter;
declare const index_d$7_lineNumberMarkers: typeof lineNumberMarkers;
declare const index_d$7_lineNumbers: typeof lineNumbers;
declare namespace index_d$7 {
  export {
    index_d$7_GutterMarker as GutterMarker,
    index_d$7_gutter as gutter,
    index_d$7_gutterLineClass as gutterLineClass,
    index_d$7_gutters as gutters,
    index_d$7_highlightActiveLineGutter as highlightActiveLineGutter,
    index_d$7_lineNumberMarkers as lineNumberMarkers,
    index_d$7_lineNumbers as lineNumbers,
  };
}

interface ChangedRange {
    fromA: number;
    toA: number;
    fromB: number;
    toB: number;
}
declare class TreeFragment {
    readonly from: number;
    readonly to: number;
    readonly tree: Tree;
    readonly offset: number;
    constructor(from: number, to: number, tree: Tree, offset: number, openStart?: boolean, openEnd?: boolean);
    get openStart(): boolean;
    get openEnd(): boolean;
    static addTree(tree: Tree, fragments?: readonly TreeFragment[], partial?: boolean): TreeFragment[];
    static applyChanges(fragments: readonly TreeFragment[], changes: readonly ChangedRange[], minGap?: number): readonly TreeFragment[];
}
interface PartialParse {
    advance(): Tree | null;
    readonly parsedPos: number;
    stopAt(pos: number): void;
    readonly stoppedAt: number | null;
}
declare abstract class Parser {
    abstract createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly {
        from: number;
        to: number;
    }[]): PartialParse;
    startParse(input: Input | string, fragments?: readonly TreeFragment[], ranges?: readonly {
        from: number;
        to: number;
    }[]): PartialParse;
    parse(input: Input | string, fragments?: readonly TreeFragment[], ranges?: readonly {
        from: number;
        to: number;
    }[]): Tree;
}
interface Input {
    readonly length: number;
    chunk(from: number): string;
    readonly lineChunks: boolean;
    read(from: number, to: number): string;
}
declare type ParseWrapper = (inner: PartialParse, input: Input, fragments: readonly TreeFragment[], ranges: readonly {
    from: number;
    to: number;
}[]) => PartialParse;

declare class NodeProp<T> {
    perNode: boolean;
    deserialize: (str: string) => T;
    constructor(config?: {
        deserialize?: (str: string) => T;
        perNode?: boolean;
    });
    add(match: {
        [selector: string]: T;
    } | ((type: NodeType) => T | undefined)): NodePropSource;
    static closedBy: NodeProp<readonly string[]>;
    static openedBy: NodeProp<readonly string[]>;
    static group: NodeProp<readonly string[]>;
    static contextHash: NodeProp<number>;
    static lookAhead: NodeProp<number>;
    static mounted: NodeProp<MountedTree>;
}
declare class MountedTree {
    readonly tree: Tree;
    readonly overlay: readonly {
        from: number;
        to: number;
    }[] | null;
    readonly parser: Parser;
    constructor(tree: Tree, overlay: readonly {
        from: number;
        to: number;
    }[] | null, parser: Parser);
}
declare type NodePropSource = (type: NodeType) => null | [NodeProp<any>, any];
declare class NodeType {
    readonly name: string;
    readonly id: number;
    static define(spec: {
        id: number;
        name?: string;
        props?: readonly ([NodeProp<any>, any] | NodePropSource)[];
        top?: boolean;
        error?: boolean;
        skipped?: boolean;
    }): NodeType;
    prop<T>(prop: NodeProp<T>): T | undefined;
    get isTop(): boolean;
    get isSkipped(): boolean;
    get isError(): boolean;
    get isAnonymous(): boolean;
    is(name: string | number): boolean;
    static none: NodeType;
    static match<T>(map: {
        [selector: string]: T;
    }): (node: NodeType) => T | undefined;
}
declare class NodeSet {
    readonly types: readonly NodeType[];
    constructor(types: readonly NodeType[]);
    extend(...props: NodePropSource[]): NodeSet;
}
declare class Tree {
    readonly type: NodeType;
    readonly children: readonly (Tree | TreeBuffer)[];
    readonly positions: readonly number[];
    readonly length: number;
    constructor(type: NodeType, children: readonly (Tree | TreeBuffer)[], positions: readonly number[], length: number, props?: readonly [NodeProp<any> | number, any][]);
    static empty: Tree;
    cursor(pos?: number, side?: -1 | 0 | 1): TreeCursor;
    fullCursor(): TreeCursor;
    get topNode(): SyntaxNode;
    resolve(pos: number, side?: -1 | 0 | 1): SyntaxNode;
    resolveInner(pos: number, side?: -1 | 0 | 1): SyntaxNode;
    iterate(spec: {
        enter(type: NodeType, from: number, to: number, get: () => SyntaxNode): false | void;
        leave?(type: NodeType, from: number, to: number, get: () => SyntaxNode): void;
        from?: number;
        to?: number;
    }): void;
    prop<T>(prop: NodeProp<T>): T | undefined;
    get propValues(): readonly [NodeProp<any> | number, any][];
    balance(config?: {
        makeTree?: (children: readonly (Tree | TreeBuffer)[], positions: readonly number[], length: number) => Tree;
    }): Tree;
    static build(data: BuildData): Tree;
}
declare type BuildData = {
    buffer: BufferCursor | readonly number[];
    nodeSet: NodeSet;
    topID: number;
    start?: number;
    bufferStart?: number;
    length?: number;
    maxBufferLength?: number;
    reused?: readonly Tree[];
    minRepeatType?: number;
};
interface BufferCursor {
    pos: number;
    id: number;
    start: number;
    end: number;
    size: number;
    next(): void;
    fork(): BufferCursor;
}
declare class TreeBuffer {
    readonly buffer: Uint16Array;
    readonly length: number;
    readonly set: NodeSet;
    constructor(buffer: Uint16Array, length: number, set: NodeSet);
}
interface SyntaxNode {
    type: NodeType;
    name: string;
    from: number;
    to: number;
    parent: SyntaxNode | null;
    firstChild: SyntaxNode | null;
    lastChild: SyntaxNode | null;
    childAfter(pos: number): SyntaxNode | null;
    childBefore(pos: number): SyntaxNode | null;
    enter(pos: number, side: -1 | 0 | 1, overlays?: boolean, buffers?: boolean): SyntaxNode | null;
    nextSibling: SyntaxNode | null;
    prevSibling: SyntaxNode | null;
    cursor: TreeCursor;
    resolve(pos: number, side?: -1 | 0 | 1): SyntaxNode;
    tree: Tree | null;
    toTree(): Tree;
    getChild(type: string | number, before?: string | number | null, after?: string | number | null): SyntaxNode | null;
    getChildren(type: string | number, before?: string | number | null, after?: string | number | null): SyntaxNode[];
}
declare class TreeCursor {
    type: NodeType;
    get name(): string;
    from: number;
    to: number;
    private buffer;
    private stack;
    private index;
    private bufferNode;
    private yieldNode;
    private yieldBuf;
    private yield;
    firstChild(): boolean;
    lastChild(): boolean;
    childAfter(pos: number): boolean;
    childBefore(pos: number): boolean;
    enter(pos: number, side: -1 | 0 | 1, overlays?: boolean, buffers?: boolean): boolean;
    parent(): boolean;
    nextSibling(): boolean;
    prevSibling(): boolean;
    private atLastNode;
    private move;
    next(enter?: boolean): boolean;
    prev(enter?: boolean): boolean;
    moveTo(pos: number, side?: -1 | 0 | 1): this;
    get node(): SyntaxNode;
    get tree(): Tree | null;
}

/**
Highlighting tags are markers that denote a highlighting category.
They are [associated](https://codemirror.net/6/docs/ref/#highlight.styleTags) with parts of a syntax
tree by a language mode, and then mapped to an actual CSS style by
a [highlight style](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle).

Because syntax tree node types and highlight styles have to be
able to talk the same language, CodeMirror uses a mostly _closed_
[vocabulary](https://codemirror.net/6/docs/ref/#highlight.tags) of syntax tags (as opposed to
traditional open string-based systems, which make it hard for
highlighting themes to cover all the tokens produced by the
various languages).

It _is_ possible to [define](https://codemirror.net/6/docs/ref/#highlight.Tag^define) your own
highlighting tags for system-internal use (where you control both
the language package and the highlighter), but such tags will not
be picked up by regular highlighters (though you can derive them
from standard tags to allow highlighters to fall back to those).
*/
declare class Tag {
    /**
    Define a new tag. If `parent` is given, the tag is treated as a
    sub-tag of that parent, and [highlight
    styles](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle) that don't mention this tag
    will try to fall back to the parent tag (or grandparent tag,
    etc).
    */
    static define(parent?: Tag): Tag;
    /**
    Define a tag _modifier_, which is a function that, given a tag,
    will return a tag that is a subtag of the original. Applying the
    same modifier to a twice tag will return the same value (`m1(t1)
    == m1(t1)`) and applying multiple modifiers will, regardless or
    order, produce the same tag (`m1(m2(t1)) == m2(m1(t1))`).

    When multiple modifiers are applied to a given base tag, each
    smaller set of modifiers is registered as a parent, so that for
    example `m1(m2(m3(t1)))` is a subtype of `m1(m2(t1))`,
    `m1(m3(t1)`, and so on.
    */
    static defineModifier(): (tag: Tag) => Tag;
}
/**
This function is used to add a set of tags to a language syntax
via
[`LRParser.configure`](https://lezer.codemirror.net/docs/ref#lr.LRParser.configure).

The argument object maps node selectors to [highlighting
tags](https://codemirror.net/6/docs/ref/#highlight.Tag) or arrays of tags.

Node selectors may hold one or more (space-separated) node paths.
Such a path can be a [node
name](https://lezer.codemirror.net/docs/ref#common.NodeType.name),
or multiple node names (or `*` wildcards) separated by slash
characters, as in `"Block/Declaration/VariableName"`. Such a path
matches the final node but only if its direct parent nodes are the
other nodes mentioned. A `*` in such a path matches any parent,
but only a single level—wildcards that match multiple parents
aren't supported, both for efficiency reasons and because Lezer
trees make it rather hard to reason about what they would match.)

A path can be ended with `/...` to indicate that the tag assigned
to the node should also apply to all child nodes, even if they
match their own style (by default, only the innermost style is
used).

When a path ends in `!`, as in `Attribute!`, no further matching
happens for the node's child nodes, and the entire node gets the
given style.

In this notation, node names that contain `/`, `!`, `*`, or `...`
must be quoted as JSON strings.

For example:

```javascript
parser.withProps(
  styleTags({
    // Style Number and BigNumber nodes
    "Number BigNumber": tags.number,
    // Style Escape nodes whose parent is String
    "String/Escape": tags.escape,
    // Style anything inside Attributes nodes
    "Attributes!": tags.meta,
    // Add a style to all content inside Italic nodes
    "Italic/...": tags.emphasis,
    // Style InvalidString nodes as both `string` and `invalid`
    "InvalidString": [tags.string, tags.invalid],
    // Style the node named "/" as punctuation
    '"/"': tags.punctuation
  })
)
```
*/
declare function styleTags(spec: {
    [selector: string]: Tag | readonly Tag[];
}): NodePropSource;
/**
A highlight style associates CSS styles with higlighting
[tags](https://codemirror.net/6/docs/ref/#highlight.Tag).
*/
declare class HighlightStyle {
    /**
    Extension that registers this style with an editor. When
    multiple highlight styles are given, they _all_ apply, assigning
    the combination of their matching styles to tokens.
    */
    readonly extension: Extension;
    /**
    An extension that installs this highlighter as a fallback
    highlight style, which will only be used if no other highlight
    styles are configured.
    */
    readonly fallback: Extension;
    /**
    A style module holding the CSS rules for this highlight style.
    When using [`highlightTree`](https://codemirror.net/6/docs/ref/#highlight.highlightTree), you may
    want to manually mount this module to show the highlighting.
    */
    readonly module: StyleModule | null;
    private map;
    private scope;
    private all;
    private constructor();
    /**
    Returns the CSS class associated with the given tag, if any.
    This method is bound to the instance by the constructor.
    */
    match(tag: Tag, scope: NodeType): string | null;
    /**
    Combines an array of highlight styles into a single match
    function that returns all of the classes assigned by the styles
    for a given tag.
    */
    static combinedMatch(styles: readonly HighlightStyle[]): (tag: Tag, scope: NodeType) => any;
    /**
    Create a highlighter style that associates the given styles to
    the given tags. The spec must be objects that hold a style tag
    or array of tags in their `tag` property, and either a single
    `class` property providing a static CSS class (for highlighters
    like [`classHighlightStyle`](https://codemirror.net/6/docs/ref/#highlight.classHighlightStyle)
    that rely on external styling), or a
    [`style-mod`](https://github.com/marijnh/style-mod#documentation)-style
    set of CSS properties (which define the styling for those tags).

    The CSS rules created for a highlighter will be emitted in the
    order of the spec's properties. That means that for elements that
    have multiple tags associated with them, styles defined further
    down in the list will have a higher CSS precedence than styles
    defined earlier.
    */
    static define(specs: readonly TagStyle[], options?: {
        /**
        By default, highlighters apply to the entire document. You can
        scope them to a single language by providing the language's
        [top node](https://codemirror.net/6/docs/ref/#language.Language.topNode) here.
        */
        scope?: NodeType;
        /**
        Add a style to _all_ content. Probably only useful in
        combination with `scope`.
        */
        all?: string | StyleSpec;
    }): HighlightStyle;
    /**
    Returns the CSS classes (if any) that the highlight styles
    active in the given state would assign to the given a style
    [tag](https://codemirror.net/6/docs/ref/#highlight.Tag) and (optional) language
    [scope](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle^define^options.scope).
    */
    static get(state: EditorState, tag: Tag, scope?: NodeType): string | null;
}
/**
The type of object used in
[`HighlightStyle.define`](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle^define).
Assigns a style to one or more highlighting
[tags](https://codemirror.net/6/docs/ref/#highlight.Tag), which can either be a fixed class name
(which must be defined elsewhere), or a set of CSS properties, for
which the library will define an anonymous class.
*/
interface TagStyle {
    /**
    The tag or tags to target.
    */
    tag: Tag | readonly Tag[];
    /**
    If given, this maps the tags to a fixed class name.
    */
    class?: string;
    /**
    Any further properties (if `class` isn't given) will be
    interpreted as in style objects given to
    [style-mod](https://github.com/marijnh/style-mod#documentation).
    The type here is `any` because of TypeScript limitations.
    */
    [styleProperty: string]: any;
}
/**
Given a string of code and a language, parse the code in that
language and run the tree highlighter over the resulting syntax
tree.
*/
declare function highlightTree(tree: Tree,
/**
Get the CSS classes used to style a given [tag](https://codemirror.net/6/docs/ref/#highlight.Tag),
or `null` if it isn't styled. (You'll often want to pass a
highlight style's [`match`](https://codemirror.net/6/docs/ref/#highlight.HighlightStyle.match)
method here.)
*/
getStyle: (tag: Tag, scope: NodeType) => string | null,
/**
Assign styling to a region of the text. Will be called, in order
of position, for any ranges where more than zero classes apply.
`classes` is a space separated string of CSS classes.
*/
putStyle: (from: number, to: number, classes: string) => void): void;
/**
The default set of highlighting [tags](https://codemirror.net/6/docs/ref/#highlight.Tag^define) used
by regular language packages and themes.

This collection is heavily biased towards programming languages,
and necessarily incomplete. A full ontology of syntactic
constructs would fill a stack of books, and be impractical to
write themes for. So try to make do with this set. If all else
fails, [open an
issue](https://github.com/codemirror/codemirror.next) to propose a
new tag, or [define](https://codemirror.net/6/docs/ref/#highlight.Tag^define) a local custom tag for
your use case.

Note that it is not obligatory to always attach the most specific
tag possible to an element—if your grammar can't easily
distinguish a certain type of element (such as a local variable),
it is okay to style it as its more general variant (a variable).

For tags that extend some parent tag, the documentation links to
the parent.
*/
declare const tags: {
    /**
    A comment.
    */
    comment: Tag;
    /**
    A line [comment](https://codemirror.net/6/docs/ref/#highlight.tags.comment).
    */
    lineComment: Tag;
    /**
    A block [comment](https://codemirror.net/6/docs/ref/#highlight.tags.comment).
    */
    blockComment: Tag;
    /**
    A documentation [comment](https://codemirror.net/6/docs/ref/#highlight.tags.comment).
    */
    docComment: Tag;
    /**
    Any kind of identifier.
    */
    name: Tag;
    /**
    The [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) of a variable.
    */
    variableName: Tag;
    /**
    A type [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    typeName: Tag;
    /**
    A tag name (subtag of [`typeName`](https://codemirror.net/6/docs/ref/#highlight.tags.typeName)).
    */
    tagName: Tag;
    /**
    A property, field, or attribute [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    propertyName: Tag;
    /**
    The [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) of a class.
    */
    className: Tag;
    /**
    A label [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    labelName: Tag;
    /**
    A namespace [name](https://codemirror.net/6/docs/ref/#highlight.tags.name).
    */
    namespace: Tag;
    /**
    The [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) of a macro.
    */
    macroName: Tag;
    /**
    A literal value.
    */
    literal: Tag;
    /**
    A string [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    string: Tag;
    /**
    A documentation [string](https://codemirror.net/6/docs/ref/#highlight.tags.string).
    */
    docString: Tag;
    /**
    A character literal (subtag of [string](https://codemirror.net/6/docs/ref/#highlight.tags.string)).
    */
    character: Tag;
    /**
    A number [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    number: Tag;
    /**
    An integer [number](https://codemirror.net/6/docs/ref/#highlight.tags.number) literal.
    */
    integer: Tag;
    /**
    A floating-point [number](https://codemirror.net/6/docs/ref/#highlight.tags.number) literal.
    */
    float: Tag;
    /**
    A boolean [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    bool: Tag;
    /**
    Regular expression [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    regexp: Tag;
    /**
    An escape [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal), for example a
    backslash escape in a string.
    */
    escape: Tag;
    /**
    A color [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    color: Tag;
    /**
    A URL [literal](https://codemirror.net/6/docs/ref/#highlight.tags.literal).
    */
    url: Tag;
    /**
    A language keyword.
    */
    keyword: Tag;
    /**
    The [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) for the self or this
    object.
    */
    self: Tag;
    /**
    The [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) for null.
    */
    null: Tag;
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) denoting some atomic value.
    */
    atom: Tag;
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) that represents a unit.
    */
    unit: Tag;
    /**
    A modifier [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword).
    */
    modifier: Tag;
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) that acts as an operator.
    */
    operatorKeyword: Tag;
    /**
    A control-flow related [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword).
    */
    controlKeyword: Tag;
    /**
    A [keyword](https://codemirror.net/6/docs/ref/#highlight.tags.keyword) that defines something.
    */
    definitionKeyword: Tag;
    /**
    An operator.
    */
    operator: Tag;
    /**
    An [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator) that defines something.
    */
    derefOperator: Tag;
    /**
    Arithmetic-related [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    arithmeticOperator: Tag;
    /**
    Logical [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    logicOperator: Tag;
    /**
    Bit [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    bitwiseOperator: Tag;
    /**
    Comparison [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    compareOperator: Tag;
    /**
    [Operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator) that updates its operand.
    */
    updateOperator: Tag;
    /**
    [Operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator) that defines something.
    */
    definitionOperator: Tag;
    /**
    Type-related [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    typeOperator: Tag;
    /**
    Control-flow [operator](https://codemirror.net/6/docs/ref/#highlight.tags.operator).
    */
    controlOperator: Tag;
    /**
    Program or markup punctuation.
    */
    punctuation: Tag;
    /**
    [Punctuation](https://codemirror.net/6/docs/ref/#highlight.tags.punctuation) that separates
    things.
    */
    separator: Tag;
    /**
    Bracket-style [punctuation](https://codemirror.net/6/docs/ref/#highlight.tags.punctuation).
    */
    bracket: Tag;
    /**
    Angle [brackets](https://codemirror.net/6/docs/ref/#highlight.tags.bracket) (usually `<` and `>`
    tokens).
    */
    angleBracket: Tag;
    /**
    Square [brackets](https://codemirror.net/6/docs/ref/#highlight.tags.bracket) (usually `[` and `]`
    tokens).
    */
    squareBracket: Tag;
    /**
    Parentheses (usually `(` and `)` tokens). Subtag of
    [bracket](https://codemirror.net/6/docs/ref/#highlight.tags.bracket).
    */
    paren: Tag;
    /**
    Braces (usually `{` and `}` tokens). Subtag of
    [bracket](https://codemirror.net/6/docs/ref/#highlight.tags.bracket).
    */
    brace: Tag;
    /**
    Content, for example plain text in XML or markup documents.
    */
    content: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that represents a heading.
    */
    heading: Tag;
    /**
    A level 1 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading1: Tag;
    /**
    A level 2 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading2: Tag;
    /**
    A level 3 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading3: Tag;
    /**
    A level 4 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading4: Tag;
    /**
    A level 5 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading5: Tag;
    /**
    A level 6 [heading](https://codemirror.net/6/docs/ref/#highlight.tags.heading).
    */
    heading6: Tag;
    /**
    A prose separator (such as a horizontal rule).
    */
    contentSeparator: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that represents a list.
    */
    list: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that represents a quote.
    */
    quote: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is emphasized.
    */
    emphasis: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is styled strong.
    */
    strong: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is part of a link.
    */
    link: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that is styled as code or
    monospace.
    */
    monospace: Tag;
    /**
    [Content](https://codemirror.net/6/docs/ref/#highlight.tags.content) that has a strike-through
    style.
    */
    strikethrough: Tag;
    /**
    Inserted text in a change-tracking format.
    */
    inserted: Tag;
    /**
    Deleted text.
    */
    deleted: Tag;
    /**
    Changed text.
    */
    changed: Tag;
    /**
    An invalid or unsyntactic element.
    */
    invalid: Tag;
    /**
    Metadata or meta-instruction.
    */
    meta: Tag;
    /**
    [Metadata](https://codemirror.net/6/docs/ref/#highlight.tags.meta) that applies to the entire
    document.
    */
    documentMeta: Tag;
    /**
    [Metadata](https://codemirror.net/6/docs/ref/#highlight.tags.meta) that annotates or adds
    attributes to a given syntactic element.
    */
    annotation: Tag;
    /**
    Processing instruction or preprocessor directive. Subtag of
    [meta](https://codemirror.net/6/docs/ref/#highlight.tags.meta).
    */
    processingInstruction: Tag;
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that indicates that a
    given element is being defined. Expected to be used with the
    various [name](https://codemirror.net/6/docs/ref/#highlight.tags.name) tags.
    */
    definition: (tag: Tag) => Tag;
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that indicates that
    something is constant. Mostly expected to be used with
    [variable names](https://codemirror.net/6/docs/ref/#highlight.tags.variableName).
    */
    constant: (tag: Tag) => Tag;
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) used to indicate that
    a [variable](https://codemirror.net/6/docs/ref/#highlight.tags.variableName) or [property
    name](https://codemirror.net/6/docs/ref/#highlight.tags.propertyName) is being called or defined
    as a function.
    */
    function: (tag: Tag) => Tag;
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that can be applied to
    [names](https://codemirror.net/6/docs/ref/#highlight.tags.name) to indicate that they belong to
    the language's standard environment.
    */
    standard: (tag: Tag) => Tag;
    /**
    [Modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that indicates a given
    [names](https://codemirror.net/6/docs/ref/#highlight.tags.name) is local to some scope.
    */
    local: (tag: Tag) => Tag;
    /**
    A generic variant [modifier](https://codemirror.net/6/docs/ref/#highlight.Tag^defineModifier) that
    can be used to tag language-specific alternative variants of
    some common tag. It is recommended for themes to define special
    forms of at least the [string](https://codemirror.net/6/docs/ref/#highlight.tags.string) and
    [variable name](https://codemirror.net/6/docs/ref/#highlight.tags.variableName) tags, since those
    come up a lot.
    */
    special: (tag: Tag) => Tag;
};
/**
A default highlight style (works well with light themes).
*/
declare const defaultHighlightStyle: HighlightStyle;
/**
This is a highlight style that adds stable, predictable classes to
tokens, for styling with external CSS.

These tags are mapped to their name prefixed with `"cmt-"` (for
example `"cmt-comment"`):

* [`link`](https://codemirror.net/6/docs/ref/#highlight.tags.link)
* [`heading`](https://codemirror.net/6/docs/ref/#highlight.tags.heading)
* [`emphasis`](https://codemirror.net/6/docs/ref/#highlight.tags.emphasis)
* [`strong`](https://codemirror.net/6/docs/ref/#highlight.tags.strong)
* [`keyword`](https://codemirror.net/6/docs/ref/#highlight.tags.keyword)
* [`atom`](https://codemirror.net/6/docs/ref/#highlight.tags.atom) [`bool`](https://codemirror.net/6/docs/ref/#highlight.tags.bool)
* [`url`](https://codemirror.net/6/docs/ref/#highlight.tags.url)
* [`labelName`](https://codemirror.net/6/docs/ref/#highlight.tags.labelName)
* [`inserted`](https://codemirror.net/6/docs/ref/#highlight.tags.inserted)
* [`deleted`](https://codemirror.net/6/docs/ref/#highlight.tags.deleted)
* [`literal`](https://codemirror.net/6/docs/ref/#highlight.tags.literal)
* [`string`](https://codemirror.net/6/docs/ref/#highlight.tags.string)
* [`number`](https://codemirror.net/6/docs/ref/#highlight.tags.number)
* [`variableName`](https://codemirror.net/6/docs/ref/#highlight.tags.variableName)
* [`typeName`](https://codemirror.net/6/docs/ref/#highlight.tags.typeName)
* [`namespace`](https://codemirror.net/6/docs/ref/#highlight.tags.namespace)
* [`macroName`](https://codemirror.net/6/docs/ref/#highlight.tags.macroName)
* [`propertyName`](https://codemirror.net/6/docs/ref/#highlight.tags.propertyName)
* [`operator`](https://codemirror.net/6/docs/ref/#highlight.tags.operator)
* [`comment`](https://codemirror.net/6/docs/ref/#highlight.tags.comment)
* [`meta`](https://codemirror.net/6/docs/ref/#highlight.tags.meta)
* [`punctuation`](https://codemirror.net/6/docs/ref/#highlight.tags.puncutation)
* [`invalid`](https://codemirror.net/6/docs/ref/#highlight.tags.invalid)

In addition, these mappings are provided:

* [`regexp`](https://codemirror.net/6/docs/ref/#highlight.tags.regexp),
  [`escape`](https://codemirror.net/6/docs/ref/#highlight.tags.escape), and
  [`special`](https://codemirror.net/6/docs/ref/#highlight.tags.special)[`(string)`](https://codemirror.net/6/docs/ref/#highlight.tags.string)
  are mapped to `"cmt-string2"`
* [`special`](https://codemirror.net/6/docs/ref/#highlight.tags.special)[`(variableName)`](https://codemirror.net/6/docs/ref/#highlight.tags.variableName)
  to `"cmt-variableName2"`
* [`local`](https://codemirror.net/6/docs/ref/#highlight.tags.local)[`(variableName)`](https://codemirror.net/6/docs/ref/#highlight.tags.variableName)
  to `"cmt-variableName cmt-local"`
* [`definition`](https://codemirror.net/6/docs/ref/#highlight.tags.definition)[`(variableName)`](https://codemirror.net/6/docs/ref/#highlight.tags.variableName)
  to `"cmt-variableName cmt-definition"`
*/
declare const classHighlightStyle: HighlightStyle;

type index_d$6_HighlightStyle = HighlightStyle;
declare const index_d$6_HighlightStyle: typeof HighlightStyle;
type index_d$6_Tag = Tag;
declare const index_d$6_Tag: typeof Tag;
type index_d$6_TagStyle = TagStyle;
declare const index_d$6_classHighlightStyle: typeof classHighlightStyle;
declare const index_d$6_defaultHighlightStyle: typeof defaultHighlightStyle;
declare const index_d$6_highlightTree: typeof highlightTree;
declare const index_d$6_styleTags: typeof styleTags;
declare const index_d$6_tags: typeof tags;
declare namespace index_d$6 {
  export {
    index_d$6_HighlightStyle as HighlightStyle,
    index_d$6_Tag as Tag,
    index_d$6_TagStyle as TagStyle,
    index_d$6_classHighlightStyle as classHighlightStyle,
    index_d$6_defaultHighlightStyle as defaultHighlightStyle,
    index_d$6_highlightTree as highlightTree,
    index_d$6_styleTags as styleTags,
    index_d$6_tags as tags,
  };
}

/**
Transaction annotation that will prevent that transaction from
being combined with other transactions in the undo history. Given
`"before"`, it'll prevent merging with previous transactions. With
`"after"`, subsequent transactions won't be combined with this
one. With `"full"`, the transaction is isolated on both sides.
*/
declare const isolateHistory: AnnotationType<"before" | "after" | "full">;
/**
This facet provides a way to register functions that, given a
transaction, provide a set of effects that the history should
store when inverting the transaction. This can be used to
integrate some kinds of effects in the history, so that they can
be undone (and redone again).
*/
declare const invertedEffects: Facet<(tr: Transaction) => readonly StateEffect<any>[], readonly ((tr: Transaction) => readonly StateEffect<any>[])[]>;
interface HistoryConfig {
    /**
    The minimum depth (amount of events) to store. Defaults to 100.
    */
    minDepth?: number;
    /**
    The maximum time (in milliseconds) that adjacent events can be
    apart and still be grouped together. Defaults to 500.
    */
    newGroupDelay?: number;
}
/**
Create a history extension with the given configuration.
*/
declare function history(config?: HistoryConfig): Extension;
/**
The state field used to store the history data. Should probably
only be used when you want to
[serialize](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) or
[deserialize](https://codemirror.net/6/docs/ref/#state.EditorState^fromJSON) state objects in a way
that preserves history.
*/
declare const historyField: StateField<unknown>;
/**
Undo a single group of history events. Returns false if no group
was available.
*/
declare const undo: StateCommand;
/**
Redo a group of history events. Returns false if no group was
available.
*/
declare const redo: StateCommand;
/**
Undo a selection change.
*/
declare const undoSelection: StateCommand;
/**
Redo a selection change.
*/
declare const redoSelection: StateCommand;
/**
The amount of undoable change events available in a given state.
*/
declare const undoDepth: (state: EditorState) => number;
/**
The amount of redoable change events available in a given state.
*/
declare const redoDepth: (state: EditorState) => number;
/**
Default key bindings for the undo history.

- Mod-z: [`undo`](https://codemirror.net/6/docs/ref/#history.undo).
- Mod-y (Mod-Shift-z on macOS): [`redo`](https://codemirror.net/6/docs/ref/#history.redo).
- Mod-u: [`undoSelection`](https://codemirror.net/6/docs/ref/#history.undoSelection).
- Alt-u (Mod-Shift-u on macOS): [`redoSelection`](https://codemirror.net/6/docs/ref/#history.redoSelection).
*/
declare const historyKeymap: readonly KeyBinding[];

declare const index_d$5_history: typeof history;
declare const index_d$5_historyField: typeof historyField;
declare const index_d$5_historyKeymap: typeof historyKeymap;
declare const index_d$5_invertedEffects: typeof invertedEffects;
declare const index_d$5_isolateHistory: typeof isolateHistory;
declare const index_d$5_redo: typeof redo;
declare const index_d$5_redoDepth: typeof redoDepth;
declare const index_d$5_redoSelection: typeof redoSelection;
declare const index_d$5_undo: typeof undo;
declare const index_d$5_undoDepth: typeof undoDepth;
declare const index_d$5_undoSelection: typeof undoSelection;
declare namespace index_d$5 {
  export {
    index_d$5_history as history,
    index_d$5_historyField as historyField,
    index_d$5_historyKeymap as historyKeymap,
    index_d$5_invertedEffects as invertedEffects,
    index_d$5_isolateHistory as isolateHistory,
    index_d$5_redo as redo,
    index_d$5_redoDepth as redoDepth,
    index_d$5_redoSelection as redoSelection,
    index_d$5_undo as undo,
    index_d$5_undoDepth as undoDepth,
    index_d$5_undoSelection as undoSelection,
  };
}

declare class Stack {
    pos: number;
    get context(): any;
    canShift(term: number): boolean;
    get parser(): LRParser;
    dialectEnabled(dialectID: number): boolean;
    private shiftContext;
    private reduceContext;
    private updateContext;
}

declare class InputStream {
    private chunk2;
    private chunk2Pos;
    next: number;
    pos: number;
    private rangeIndex;
    private range;
    resolveOffset(offset: number, assoc: -1 | 1): number;
    peek(offset: number): any;
    acceptToken(token: number, endOffset?: number): void;
    private getChunk;
    private readNext;
    advance(n?: number): number;
    private setDone;
}
interface Tokenizer {
}
interface ExternalOptions {
    contextual?: boolean;
    fallback?: boolean;
    extend?: boolean;
}
declare class ExternalTokenizer implements Tokenizer {
    constructor(token: (input: InputStream, stack: Stack) => void, options?: ExternalOptions);
}

declare class ContextTracker<T> {
    constructor(spec: {
        start: T;
        shift?(context: T, term: number, stack: Stack, input: InputStream): T;
        reduce?(context: T, term: number, stack: Stack, input: InputStream): T;
        reuse?(context: T, node: Tree, stack: Stack, input: InputStream): T;
        hash?(context: T): number;
        strict?: boolean;
    });
}
interface ParserConfig {
    props?: readonly NodePropSource[];
    top?: string;
    dialect?: string;
    tokenizers?: {
        from: ExternalTokenizer;
        to: ExternalTokenizer;
    }[];
    contextTracker?: ContextTracker<any>;
    strict?: boolean;
    wrap?: ParseWrapper;
    bufferLength?: number;
}
declare class LRParser extends Parser {
    readonly nodeSet: NodeSet;
    createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly {
        from: number;
        to: number;
    }[]): PartialParse;
    configure(config: ParserConfig): LRParser;
    getName(term: number): string;
    get topNode(): NodeType;
}

/**
Node prop stored in a grammar's top syntax node to provide the
facet that stores language data for that language.
*/
declare const languageDataProp: NodeProp<Facet<{
    [name: string]: any;
}, readonly {
    [name: string]: any;
}[]>>;
/**
Helper function to define a facet (to be added to the top syntax
node(s) for a language via
[`languageDataProp`](https://codemirror.net/6/docs/ref/#language.languageDataProp)), that will be
used to associate language data with the language. You
probably only need this when subclassing
[`Language`](https://codemirror.net/6/docs/ref/#language.Language).
*/
declare function defineLanguageFacet(baseData?: {
    [name: string]: any;
}): Facet<{
    [name: string]: any;
}, readonly {
    [name: string]: any;
}[]>;
/**
A language object manages parsing and per-language
[metadata](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt). Parse data is
managed as a [Lezer](https://lezer.codemirror.net) tree. You'll
want to subclass this class for custom parsers, or use the
[`LRLanguage`](https://codemirror.net/6/docs/ref/#language.LRLanguage) or
[`StreamLanguage`](https://codemirror.net/6/docs/ref/#stream-parser.StreamLanguage) abstractions for
[Lezer](https://lezer.codemirror.net/) or stream parsers.
*/
declare class Language {
    /**
    The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) data
    facet used for this language.
    */
    readonly data: Facet<{
        [name: string]: any;
    }>;
    /**
    The node type of the top node of trees produced by this parser.
    */
    readonly topNode: NodeType;
    /**
    The extension value to install this provider.
    */
    readonly extension: Extension;
    /**
    The parser object. Can be useful when using this as a [nested
    parser](https://lezer.codemirror.net/docs/ref#common.Parser).
    */
    parser: Parser;
    /**
    Construct a language object. You usually don't need to invoke
    this directly. But when you do, make sure you use
    [`defineLanguageFacet`](https://codemirror.net/6/docs/ref/#language.defineLanguageFacet) to create
    the first argument.
    */
    constructor(
    /**
    The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) data
    facet used for this language.
    */
    data: Facet<{
        [name: string]: any;
    }>, parser: Parser,
    /**
    The node type of the top node of trees produced by this parser.
    */
    topNode: NodeType, extraExtensions?: Extension[]);
    /**
    Query whether this language is active at the given position.
    */
    isActiveAt(state: EditorState, pos: number, side?: -1 | 0 | 1): boolean;
    /**
    Find the document regions that were parsed using this language.
    The returned regions will _include_ any nested languages rooted
    in this language, when those exist.
    */
    findRegions(state: EditorState): {
        from: number;
        to: number;
    }[];
    /**
    Indicates whether this language allows nested languages. The
    default implementation returns true.
    */
    get allowsNesting(): boolean;
}
/**
A subclass of [`Language`](https://codemirror.net/6/docs/ref/#language.Language) for use with Lezer
[LR parsers](https://lezer.codemirror.net/docs/ref#lr.LRParser)
parsers.
*/
declare class LRLanguage extends Language {
    readonly parser: LRParser;
    private constructor();
    /**
    Define a language from a parser.
    */
    static define(spec: {
        /**
        The parser to use. Should already have added editor-relevant
        node props (and optionally things like dialect and top rule)
        configured.
        */
        parser: LRParser;
        /**
        [Language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt)
        to register for this language.
        */
        languageData?: {
            [name: string]: any;
        };
    }): LRLanguage;
    /**
    Create a new instance of this language with a reconfigured
    version of its parser.
    */
    configure(options: ParserConfig): LRLanguage;
    get allowsNesting(): boolean;
}
/**
Get the syntax tree for a state, which is the current (possibly
incomplete) parse tree of active [language](https://codemirror.net/6/docs/ref/#language.Language),
or the empty tree if there is no language available.
*/
declare function syntaxTree(state: EditorState): Tree;
/**
Try to get a parse tree that spans at least up to `upto`. The
method will do at most `timeout` milliseconds of work to parse
up to that point if the tree isn't already available.
*/
declare function ensureSyntaxTree(state: EditorState, upto: number, timeout?: number): Tree | null;
/**
A parse context provided to parsers working on the editor content.
*/
declare class ParseContext {
    private parser;
    /**
    The current editor state.
    */
    readonly state: EditorState;
    /**
    Tree fragments that can be reused by incremental re-parses.
    */
    fragments: readonly TreeFragment[];
    treeLen: number;
    /**
    The current editor viewport (or some overapproximation
    thereof). Intended to be used for opportunistically avoiding
    work (in which case
    [`skipUntilInView`](https://codemirror.net/6/docs/ref/#language.EditorParseContext.skipUntilInView)
    should be called to make sure the parser is restarted when the
    skipped region becomes visible).
    */
    viewport: {
        from: number;
        to: number;
    };
    private parse;
    private startParse;
    private withContext;
    private withoutTempSkipped;
    /**
    Notify the parse scheduler that the given region was skipped
    because it wasn't in view, and the parse should be restarted
    when it comes into view.
    */
    skipUntilInView(from: number, to: number): void;
    /**
    Returns a parser intended to be used as placeholder when
    asynchronously loading a nested parser. It'll skip its input and
    mark it as not-really-parsed, so that the next update will parse
    it again.

    When `until` is given, a reparse will be scheduled when that
    promise resolves.
    */
    static getSkippingParser(until?: Promise<unknown>): {
        createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly {
            from: number;
            to: number;
        }[]): PartialParse;
        startParse(input: string | Input, fragments?: readonly TreeFragment[] | undefined, ranges?: readonly {
            from: number;
            to: number;
        }[] | undefined): PartialParse;
        parse(input: string | Input, fragments?: readonly TreeFragment[] | undefined, ranges?: readonly {
            from: number;
            to: number;
        }[] | undefined): Tree;
    };
    /**
    Get the context for the current parse, or `null` if no editor
    parse is in progress.
    */
    static get(): ParseContext | null;
}
/**
The facet used to associate a language with an editor state.
*/
declare const language: Facet<Language, Language | null>;
/**
This class bundles a [language object](https://codemirror.net/6/docs/ref/#language.Language) with an
optional set of supporting extensions. Language packages are
encouraged to export a function that optionally takes a
configuration object and returns a `LanguageSupport` instance, as
the main way for client code to use the package.
*/
declare class LanguageSupport {
    /**
    The language object.
    */
    readonly language: Language;
    /**
    An optional set of supporting extensions. When nesting a
    language in another language, the outer language is encouraged
    to include the supporting extensions for its inner languages
    in its own set of support extensions.
    */
    readonly support: Extension;
    /**
    An extension including both the language and its support
    extensions. (Allowing the object to be used as an extension
    value itself.)
    */
    extension: Extension;
    /**
    Create a support object.
    */
    constructor(
    /**
    The language object.
    */
    language: Language,
    /**
    An optional set of supporting extensions. When nesting a
    language in another language, the outer language is encouraged
    to include the supporting extensions for its inner languages
    in its own set of support extensions.
    */
    support?: Extension);
}
/**
Language descriptions are used to store metadata about languages
and to dynamically load them. Their main role is finding the
appropriate language for a filename or dynamically loading nested
parsers.
*/
declare class LanguageDescription {
    /**
    The name of this language.
    */
    readonly name: string;
    /**
    Alternative names for the mode (lowercased, includes `this.name`).
    */
    readonly alias: readonly string[];
    /**
    File extensions associated with this language.
    */
    readonly extensions: readonly string[];
    /**
    Optional filename pattern that should be associated with this
    language.
    */
    readonly filename: RegExp | undefined;
    private loadFunc;
    /**
    If the language has been loaded, this will hold its value.
    */
    support: LanguageSupport | undefined;
    private loading;
    private constructor();
    /**
    Start loading the the language. Will return a promise that
    resolves to a [`LanguageSupport`](https://codemirror.net/6/docs/ref/#language.LanguageSupport)
    object when the language successfully loads.
    */
    load(): Promise<LanguageSupport>;
    /**
    Create a language description.
    */
    static of(spec: {
        /**
        The language's name.
        */
        name: string;
        /**
        An optional array of alternative names.
        */
        alias?: readonly string[];
        /**
        An optional array of extensions associated with this language.
        */
        extensions?: readonly string[];
        /**
        An optional filename pattern associated with this language.
        */
        filename?: RegExp;
        /**
        A function that will asynchronously load the language.
        */
        load: () => Promise<LanguageSupport>;
    }): LanguageDescription;
    /**
    Look for a language in the given array of descriptions that
    matches the filename. Will first match
    [`filename`](https://codemirror.net/6/docs/ref/#language.LanguageDescription.filename) patterns,
    and then [extensions](https://codemirror.net/6/docs/ref/#language.LanguageDescription.extensions),
    and return the first language that matches.
    */
    static matchFilename(descs: readonly LanguageDescription[], filename: string): LanguageDescription | null;
    /**
    Look for a language whose name or alias matches the the given
    name (case-insensitively). If `fuzzy` is true, and no direct
    matchs is found, this'll also search for a language whose name
    or alias occurs in the string (for names shorter than three
    characters, only when surrounded by non-word characters).
    */
    static matchLanguageName(descs: readonly LanguageDescription[], name: string, fuzzy?: boolean): LanguageDescription | null;
}

/**
Facet that defines a way to provide a function that computes the
appropriate indentation depth at the start of a given line, or
`null` to indicate no appropriate indentation could be determined.
*/
declare const indentService: Facet<(context: IndentContext, pos: number) => number | null, readonly ((context: IndentContext, pos: number) => number | null)[]>;
/**
Facet for overriding the unit by which indentation happens.
Should be a string consisting either entirely of spaces or
entirely of tabs. When not set, this defaults to 2 spaces.
*/
declare const indentUnit: Facet<string, string>;
/**
Return the _column width_ of an indent unit in the state.
Determined by the [`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit)
facet, and [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) when that
contains tabs.
*/
declare function getIndentUnit(state: EditorState): number;
/**
Create an indentation string that covers columns 0 to `cols`.
Will use tabs for as much of the columns as possible when the
[`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit) facet contains
tabs.
*/
declare function indentString(state: EditorState, cols: number): string;
/**
Get the indentation at the given position. Will first consult any
[indent services](https://codemirror.net/6/docs/ref/#language.indentService) that are registered,
and if none of those return an indentation, this will check the
syntax tree for the [indent node prop](https://codemirror.net/6/docs/ref/#language.indentNodeProp)
and use that if found. Returns a number when an indentation could
be determined, and null otherwise.
*/
declare function getIndentation(context: IndentContext | EditorState, pos: number): number | null;
/**
Indentation contexts are used when calling [indentation
services](https://codemirror.net/6/docs/ref/#language.indentService). They provide helper utilities
useful in indentation logic, and can selectively override the
indentation reported for some lines.
*/
declare class IndentContext {
    /**
    The editor state.
    */
    readonly state: EditorState;
    /**
    The indent unit (number of columns per indentation level).
    */
    unit: number;
    /**
    Create an indent context.
    */
    constructor(
    /**
    The editor state.
    */
    state: EditorState,
    /**
    @internal
    */
    options?: {
        /**
        Override line indentations provided to the indentation
        helper function, which is useful when implementing region
        indentation, where indentation for later lines needs to refer
        to previous lines, which may have been reindented compared to
        the original start state. If given, this function should
        return -1 for lines (given by start position) that didn't
        change, and an updated indentation otherwise.
        */
        overrideIndentation?: (pos: number) => number;
        /**
        Make it look, to the indent logic, like a line break was
        added at the given position (which is mostly just useful for
        implementing something like
        [`insertNewlineAndIndent`](https://codemirror.net/6/docs/ref/#commands.insertNewlineAndIndent)).
        */
        simulateBreak?: number;
        /**
        When `simulateBreak` is given, this can be used to make the
        simulate break behave like a double line break.
        */
        simulateDoubleBreak?: boolean;
    });
    /**
    Get a description of the line at the given position, taking
    [simulated line
    breaks](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
    into account. If there is such a break at `pos`, the `bias`
    argument determines whether the part of the line line before or
    after the break is used.
    */
    lineAt(pos: number, bias?: -1 | 1): {
        text: string;
        from: number;
    };
    /**
    Get the text directly after `pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */
    textAfterPos(pos: number, bias?: -1 | 1): string;
    /**
    Find the column for the given position.
    */
    column(pos: number, bias?: -1 | 1): number;
    /**
    Find the column position (taking tabs into account) of the given
    position in the given string.
    */
    countColumn(line: string, pos?: number): number;
    /**
    Find the indentation column of the line at the given point.
    */
    lineIndent(pos: number, bias?: -1 | 1): number;
    /**
    Returns the [simulated line
    break](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
    for this context, if any.
    */
    get simulatedBreak(): number | null;
}
/**
A syntax tree node prop used to associate indentation strategies
with node types. Such a strategy is a function from an indentation
context to a column number or null, where null indicates that no
definitive indentation can be determined.
*/
declare const indentNodeProp: NodeProp<(context: TreeIndentContext) => number | null>;
/**
Objects of this type provide context information and helper
methods to indentation functions.
*/
declare class TreeIndentContext extends IndentContext {
    private base;
    /**
    The position at which indentation is being computed.
    */
    readonly pos: number;
    /**
    The syntax tree node to which the indentation strategy
    applies.
    */
    readonly node: SyntaxNode;
    /**
    Get the text directly after `this.pos`, either the entire line
    or the next 100 characters, whichever is shorter.
    */
    get textAfter(): string;
    /**
    Get the indentation at the reference line for `this.node`, which
    is the line on which it starts, unless there is a node that is
    _not_ a parent of this node covering the start of that line. If
    so, the line at the start of that node is tried, again skipping
    on if it is covered by another such node.
    */
    get baseIndent(): number;
    /**
    Continue looking for indentations in the node's parent nodes,
    and return the result of that.
    */
    continue(): number | null;
}
/**
An indentation strategy for delimited (usually bracketed) nodes.
Will, by default, indent one unit more than the parent's base
indent unless the line starts with a closing token. When `align`
is true and there are non-skipped nodes on the node's opening
line, the content of the node will be aligned with the end of the
opening node, like this:

    foo(bar,
        baz)
*/
declare function delimitedIndent({ closing, align, units }: {
    closing: string;
    align?: boolean;
    units?: number;
}): (context: TreeIndentContext) => number;
/**
An indentation strategy that aligns a node's content to its base
indentation.
*/
declare const flatIndent: (context: TreeIndentContext) => number;
/**
Creates an indentation strategy that, by default, indents
continued lines one unit more than the node's base indentation.
You can provide `except` to prevent indentation of lines that
match a pattern (for example `/^else\b/` in `if`/`else`
constructs), and you can change the amount of units used with the
`units` option.
*/
declare function continuedIndent({ except, units }?: {
    except?: RegExp;
    units?: number;
}): (context: TreeIndentContext) => number;
/**
Enables reindentation on input. When a language defines an
`indentOnInput` field in its [language
data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt), which must hold a regular
expression, the line at the cursor will be reindented whenever new
text is typed and the input from the start of the line up to the
cursor matches that regexp.

To avoid unneccesary reindents, it is recommended to start the
regexp with `^` (usually followed by `\s*`), and end it with `$`.
For example, `/^\s*\}$/` will reindent when a closing brace is
added at the start of a line.
*/
declare function indentOnInput(): Extension;

/**
A facet that registers a code folding service. When called with
the extent of a line, such a function should return a foldable
range that starts on that line (but continues beyond it), if one
can be found.
*/
declare const foldService: Facet<(state: EditorState, lineStart: number, lineEnd: number) => ({
    from: number;
    to: number;
} | null), readonly ((state: EditorState, lineStart: number, lineEnd: number) => ({
    from: number;
    to: number;
} | null))[]>;
/**
This node prop is used to associate folding information with
syntax node types. Given a syntax node, it should check whether
that tree is foldable and return the range that can be collapsed
when it is.
*/
declare const foldNodeProp: NodeProp<(node: SyntaxNode, state: EditorState) => ({
    from: number;
    to: number;
} | null)>;
/**
[Fold](https://codemirror.net/6/docs/ref/#language.foldNodeProp) function that folds everything but
the first and the last child of a syntax node. Useful for nodes
that start and end with delimiters.
*/
declare function foldInside(node: SyntaxNode): {
    from: number;
    to: number;
} | null;
/**
Check whether the given line is foldable. First asks any fold
services registered through
[`foldService`](https://codemirror.net/6/docs/ref/#language.foldService), and if none of them return
a result, tries to query the [fold node
prop](https://codemirror.net/6/docs/ref/#language.foldNodeProp) of syntax nodes that cover the end
of the line.
*/
declare function foldable(state: EditorState, lineStart: number, lineEnd: number): {
    from: number;
    to: number;
} | null;

type index_d$4_IndentContext = IndentContext;
declare const index_d$4_IndentContext: typeof IndentContext;
type index_d$4_LRLanguage = LRLanguage;
declare const index_d$4_LRLanguage: typeof LRLanguage;
type index_d$4_Language = Language;
declare const index_d$4_Language: typeof Language;
type index_d$4_LanguageDescription = LanguageDescription;
declare const index_d$4_LanguageDescription: typeof LanguageDescription;
type index_d$4_LanguageSupport = LanguageSupport;
declare const index_d$4_LanguageSupport: typeof LanguageSupport;
type index_d$4_ParseContext = ParseContext;
declare const index_d$4_ParseContext: typeof ParseContext;
type index_d$4_TreeIndentContext = TreeIndentContext;
declare const index_d$4_TreeIndentContext: typeof TreeIndentContext;
declare const index_d$4_continuedIndent: typeof continuedIndent;
declare const index_d$4_defineLanguageFacet: typeof defineLanguageFacet;
declare const index_d$4_delimitedIndent: typeof delimitedIndent;
declare const index_d$4_ensureSyntaxTree: typeof ensureSyntaxTree;
declare const index_d$4_flatIndent: typeof flatIndent;
declare const index_d$4_foldInside: typeof foldInside;
declare const index_d$4_foldNodeProp: typeof foldNodeProp;
declare const index_d$4_foldService: typeof foldService;
declare const index_d$4_foldable: typeof foldable;
declare const index_d$4_getIndentUnit: typeof getIndentUnit;
declare const index_d$4_getIndentation: typeof getIndentation;
declare const index_d$4_indentNodeProp: typeof indentNodeProp;
declare const index_d$4_indentOnInput: typeof indentOnInput;
declare const index_d$4_indentService: typeof indentService;
declare const index_d$4_indentString: typeof indentString;
declare const index_d$4_indentUnit: typeof indentUnit;
declare const index_d$4_language: typeof language;
declare const index_d$4_languageDataProp: typeof languageDataProp;
declare const index_d$4_syntaxTree: typeof syntaxTree;
declare namespace index_d$4 {
  export {
    index_d$4_IndentContext as IndentContext,
    index_d$4_LRLanguage as LRLanguage,
    index_d$4_Language as Language,
    index_d$4_LanguageDescription as LanguageDescription,
    index_d$4_LanguageSupport as LanguageSupport,
    index_d$4_ParseContext as ParseContext,
    index_d$4_TreeIndentContext as TreeIndentContext,
    index_d$4_continuedIndent as continuedIndent,
    index_d$4_defineLanguageFacet as defineLanguageFacet,
    index_d$4_delimitedIndent as delimitedIndent,
    index_d$4_ensureSyntaxTree as ensureSyntaxTree,
    index_d$4_flatIndent as flatIndent,
    index_d$4_foldInside as foldInside,
    index_d$4_foldNodeProp as foldNodeProp,
    index_d$4_foldService as foldService,
    index_d$4_foldable as foldable,
    index_d$4_getIndentUnit as getIndentUnit,
    index_d$4_getIndentation as getIndentation,
    index_d$4_indentNodeProp as indentNodeProp,
    index_d$4_indentOnInput as indentOnInput,
    index_d$4_indentService as indentService,
    index_d$4_indentString as indentString,
    index_d$4_indentUnit as indentUnit,
    index_d$4_language as language,
    index_d$4_languageDataProp as languageDataProp,
    index_d$4_syntaxTree as syntaxTree,
  };
}

/**
A language provider based on the [Lezer CSS
parser](https://github.com/lezer-parser/css), extended with
highlighting and indentation information.
*/
declare const cssLanguage: LRLanguage;
/**
CSS property and value keyword completion.
*/
declare const cssCompletion: Extension;
/**
Language support for CSS.
*/
declare function css(): LanguageSupport;

declare const index_d$3_css: typeof css;
declare const index_d$3_cssCompletion: typeof cssCompletion;
declare const index_d$3_cssLanguage: typeof cssLanguage;
declare namespace index_d$3 {
  export {
    index_d$3_css as css,
    index_d$3_cssCompletion as cssCompletion,
    index_d$3_cssLanguage as cssLanguage,
  };
}

/**
A language provider based on the [Lezer HTML
parser](https://github.com/lezer-parser/html), extended with the
JavaScript and CSS parsers to parse the content of `<script>` and
`<style>` tags.
*/
declare const htmlLanguage: LRLanguage;
/**
HTML tag completion. Opens and closes tags and attributes in a
context-aware way.
*/
declare const htmlCompletion: Extension;
/**
Language support for HTML, including
[`htmlCompletion`](https://codemirror.net/6/docs/ref/#lang-html.htmlCompletion) and JavaScript and
CSS support extensions.
*/
declare function html(config?: {
    /**
    By default, the syntax tree will highlight mismatched closing
    tags. Set this to `false` to turn that off (for example when you
    expect to only be parsing a fragment of HTML text, not a full
    document).
    */
    matchClosingTags?: boolean;
}): LanguageSupport;

declare const index_d$2_html: typeof html;
declare const index_d$2_htmlCompletion: typeof htmlCompletion;
declare const index_d$2_htmlLanguage: typeof htmlLanguage;
declare namespace index_d$2 {
  export {
    index_d$2_html as html,
    index_d$2_htmlCompletion as htmlCompletion,
    index_d$2_htmlLanguage as htmlLanguage,
  };
}

/**
Objects type used to represent individual completions.
*/
interface Completion {
    /**
    The label to show in the completion picker. This is what input
    is matched agains to determine whether a completion matches (and
    how well it matches).
    */
    label: string;
    /**
    An optional short piece of information to show (with a different
    style) after the label.
    */
    detail?: string;
    /**
    Additional info to show when the completion is selected. Can be
    a plain string or a function that'll render the DOM structure to
    show when invoked.
    */
    info?: string | ((completion: Completion) => (Node | Promise<Node>));
    /**
    How to apply the completion. The default is to replace it with
    its [label](https://codemirror.net/6/docs/ref/#autocomplete.Completion.label). When this holds a
    string, the completion range is replaced by that string. When it
    is a function, that function is called to perform the
    completion.
    */
    apply?: string | ((view: EditorView, completion: Completion, from: number, to: number) => void);
    /**
    The type of the completion. This is used to pick an icon to show
    for the completion. Icons are styled with a CSS class created by
    appending the type name to `"cm-completionIcon-"`. You can
    define or restyle icons by defining these selectors. The base
    library defines simple icons for `class`, `constant`, `enum`,
    `function`, `interface`, `keyword`, `method`, `namespace`,
    `property`, `text`, `type`, and `variable`.

    Multiple types can be provided by separating them with spaces.
    */
    type?: string;
    /**
    When given, should be a number from -99 to 99 that adjusts how
    this completion is ranked compared to other completions that
    match the input as well as this one. A negative number moves it
    down the list, a positive number moves it up.
    */
    boost?: number;
}

/**
Describes a problem or hint for a piece of code.
*/
interface Diagnostic {
    /**
    The start position of the relevant text.
    */
    from: number;
    /**
    The end position. May be equal to `from`, though actually
    covering text is preferable.
    */
    to: number;
    /**
    The severity of the problem. This will influence how it is
    displayed.
    */
    severity: "info" | "warning" | "error";
    /**
    An optional source string indicating where the diagnostic is
    coming from. You can put the name of your linter here, if
    applicable.
    */
    source?: string;
    /**
    The message associated with this diagnostic.
    */
    message: string;
    /**
    An optional array of actions that can be taken on this
    diagnostic.
    */
    actions?: readonly Action[];
}
/**
An action associated with a diagnostic.
*/
interface Action {
    /**
    The label to show to the user. Should be relatively short.
    */
    name: string;
    /**
    The function to call when the user activates this action. Is
    given the diagnostic's _current_ position, which may have
    changed since the creation of the diagnostic due to editing.
    */
    apply: (view: EditorView, from: number, to: number) => void;
}

/**
A language provider based on the [Lezer JavaScript
parser](https://github.com/lezer-parser/javascript), extended with
highlighting and indentation information.
*/
declare const javascriptLanguage: LRLanguage;
/**
A language provider for TypeScript.
*/
declare const typescriptLanguage: LRLanguage;
/**
Language provider for JSX.
*/
declare const jsxLanguage: LRLanguage;
/**
Language provider for JSX + TypeScript.
*/
declare const tsxLanguage: LRLanguage;
/**
JavaScript support. Includes [snippet](https://codemirror.net/6/docs/ref/#lang-javascript.snippets)
completion.
*/
declare function javascript(config?: {
    jsx?: boolean;
    typescript?: boolean;
}): LanguageSupport;

/**
A collection of JavaScript-related
[snippets](https://codemirror.net/6/docs/ref/#autocomplete.snippet).
*/
declare const snippets: readonly Completion[];

/**
Connects an [ESLint](https://eslint.org/) linter to CodeMirror's
[lint](https://codemirror.net/6/docs/ref/#lint) integration. `eslint` should be an instance of the
[`Linter`](https://eslint.org/docs/developer-guide/nodejs-api#linter)
class, and `config` an optional ESLint configuration. The return
value of this function can be passed to [`linter`](https://codemirror.net/6/docs/ref/#lint.linter)
to create a JavaScript linting extension.

Note that ESLint targets node, and is tricky to run in the
browser. The [eslint4b](https://github.com/mysticatea/eslint4b)
and
[eslint4b-prebuilt](https://github.com/marijnh/eslint4b-prebuilt/)
packages may help with that.
*/
declare function esLint(eslint: any, config?: any): (view: EditorView) => Diagnostic[];

declare const index_d$1_esLint: typeof esLint;
declare const index_d$1_javascript: typeof javascript;
declare const index_d$1_javascriptLanguage: typeof javascriptLanguage;
declare const index_d$1_jsxLanguage: typeof jsxLanguage;
declare const index_d$1_snippets: typeof snippets;
declare const index_d$1_tsxLanguage: typeof tsxLanguage;
declare const index_d$1_typescriptLanguage: typeof typescriptLanguage;
declare namespace index_d$1 {
  export {
    index_d$1_esLint as esLint,
    index_d$1_javascript as javascript,
    index_d$1_javascriptLanguage as javascriptLanguage,
    index_d$1_jsxLanguage as jsxLanguage,
    index_d$1_snippets as snippets,
    index_d$1_tsxLanguage as tsxLanguage,
    index_d$1_typescriptLanguage as typescriptLanguage,
  };
}

interface Config {
    /**
    Whether the bracket matching should look at the character after
    the cursor when matching (if the one before isn't a bracket).
    Defaults to true.
    */
    afterCursor?: boolean;
    /**
    The bracket characters to match, as a string of pairs. Defaults
    to `"()[]{}"`. Note that these are only used as fallback when
    there is no [matching
    information](https://lezer.codemirror.net/docs/ref/#common.NodeProp^closedBy)
    in the syntax tree.
    */
    brackets?: string;
    /**
    The maximum distance to scan for matching brackets. This is only
    relevant for brackets not encoded in the syntax tree. Defaults
    to 10 000.
    */
    maxScanDistance?: number;
}
/**
Create an extension that enables bracket matching. Whenever the
cursor is next to a bracket, that bracket and the one it matches
are highlighted. Or, when no matching bracket is found, another
highlighting style is used to indicate this.
*/
declare function bracketMatching(config?: Config): Extension;
/**
The result returned from `matchBrackets`.
*/
interface MatchResult {
    /**
    The extent of the bracket token found.
    */
    start: {
        from: number;
        to: number;
    };
    /**
    The extent of the matched token, if any was found.
    */
    end?: {
        from: number;
        to: number;
    };
    /**
    Whether the tokens match. This can be false even when `end` has
    a value, if that token doesn't match the opening token.
    */
    matched: boolean;
}
/**
Find the matching bracket for the token at `pos`, scanning
direction `dir`. Only the `brackets` and `maxScanDistance`
properties are used from `config`, if given. Returns null if no
bracket was found at `pos`, or a match result otherwise.
*/
declare function matchBrackets(state: EditorState, pos: number, dir: -1 | 1, config?: Config): MatchResult | null;

type index_d_Config = Config;
type index_d_MatchResult = MatchResult;
declare const index_d_bracketMatching: typeof bracketMatching;
declare const index_d_matchBrackets: typeof matchBrackets;
declare namespace index_d {
  export {
    index_d_Config as Config,
    index_d_MatchResult as MatchResult,
    index_d_bracketMatching as bracketMatching,
    index_d_matchBrackets as matchBrackets,
  };
}

export { index_d$8 as closebrackets, index_d$9 as commands, index_d$7 as gutter, index_d$6 as highlight, index_d$5 as history, index_d$3 as langCss, index_d$2 as langHtml, index_d$1 as langJavascript, index_d$4 as language, index_d as matchbrackets, index_d$b as state, index_d$a as view };
