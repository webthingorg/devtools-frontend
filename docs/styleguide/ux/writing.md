# How to write UI text

[TOC]

## Checklist

For every CL that adds or changes UI texts in the Chrome DevTools front-end, use
this checklist to make sure that the new or changed strings meet the basic
requirements for good UX writing.

### General

*   Give the right info at the right time and place
*   Don't write more than 1 sentence but if you do, break up text into sections, lists, tooltips, and <u>Learn more</u> links
*   Be friendly but not ridiculous

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
This API lets you collect data about what your users like.
</td>
<td style="background:#fdd">
Dude! This API is totally awesome!
</td>
</tr>
<tr style="font-family:monospace">
<td></td>
<td style="background:#fdd">
This API may enable the acquisition of information pertaining to user preferences.
</td>
</tr>
</table>

### Patterns

*   Follow the
    [F pattern](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices#3a833840-43db-4f6e-8133-c4665c17d176)
*   One sentence, one idea
*   "To get what you want, do this"
*   "Do this to recover"

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
To save changes, drop a folder here
</td>
<td style="background:#fdd">
Drop in a folder to add to Workspace (what's a Workspace?)
</td>
</tr>
<tr style="font-family:monospace">
<td style="background:#dfd">
Shorten filename to 64 characters or less
</td>
<td style="background:#fdd">
Invalid filename
</td>
</tr>
</table>

### Mechanics

*   Say “you”
*   [Look up](https://translate.google.com) short synonyms

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Keep, more, stop, get, send, add, fit, …
</td>
<td style="background:#fdd">
Preserve, additional, prevent, receive, submit, create, …
</td>
</tr>
</table>

<details>
<summary>Expand for more examples</summary>
<table>
<thead>
<tr>
    <th>Good</th>
    <th>Bad</th>
</tr>
</thead>
<tbody>
<tr>
    <td>keep</td>
    <td>preserve</td>
</tr>
<tr>
    <td>more</td>
    <td>additionally</td>
</tr>
<tr>
    <td>stop</td>
    <td>prevent</td>
</tr>
<tr>
    <td>get</td>
    <td>receive</td>
</tr>
<tr>
    <td>send</td>
    <td>submit</td>
</tr>
<tr>
    <td>change (noun)</td>
    <td>modification</td>
</tr>
<tr>
    <td>unknown</td>
    <td>unrecognized</td>
</tr>
<tr>
    <td>add</td>
    <td>create</td>
</tr>
<tr>
    <td>fit (adj)</td>
    <td>appropriate</td>
</tr>
<tr>
    <td>see</td>
    <td>view (verb)</td>
</tr>
<tr>
    <td>help</td>
    <td>assist</td>
</tr>
<tr>
    <td>group</td>
    <td>category</td>
</tr>
<tr>
    <td>show</td>
    <td>display (verb)</td>
</tr>
</tbody>
</table>
</details>

*   Cut, cut, cut

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td></td>
<td style="background:#fdd">
Please, sorry, very, strongly, seamless, awesome, there is, there are, fast, quick, …
</td>
</tr>
</table>

*   Use active voice

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
DevTools loaded source maps
</td>
<td style="background:#fdd">
Source maps were loaded by DevTools
</td>
</tr>
</table>

*   Use [contractions](https://developers.google.com/style/contractions) but avoid [Latin abbreviations](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices#98d02949-1933-49df-b136-f7b72620b950)

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Can’t, don’t, isn’t, for example, that is, and more
</td>
<td style="background:#fdd">
Cannot, do not, is not, e.g., i.e., etc.
</td>
</tr>
</table>

*   Use simple and common terms

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Website, page, extension, function
</td>
<td style="background:#fdd">
Debug target, debuggee, content script, call frame
</td>
</tr>
</table>

### Cosmetics

*   Use sentence-case, not Title-Case (see [Capitalization guidelines](#capitalization-guidelines) below).

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Periodic background sync
</td>
<td style="background:#fdd">
Periodic Background Sync
</td>
</tr>
</table>

*   Punctuate consistently
    *   Use serial comma: A, B, and C
    *   Skip periods in case of a single sentence

*   Don't spell out numbers

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
1, 2, 3, …
</td>
<td style="background:#fdd">
One, two, three, …
</td>
</tr>
</table>

*   Use just 2 types of links: <u>Learn more</u> and the
    [GM3 `Help` icon](https://fonts.corp.google.com/icons?selected=Google+Symbols:help).


## Capitalization guidelines

### Capitalize product names

Capitalize [product names](https://developers.google.com/style/product-names#capitalize),
web API names, but not [feature names](https://developers.google.com/style/product-names#feature-names).

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Chrome DevTools (product) lets you debug Background Fetch API (web API) by
logging background fetch (feature) events.
</td>
<td style="background:#fdd">
Chrome devtools lets you debug background fetch API by logging
Background Fetch events.
</td>
</tr>
</table>

### Use sentence case

Use sentence case in [UI element names](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices#fc5c2a78-f4bf-4d42-bdac-42ff80391129) as well as [titles and headings in text](https://developers.google.com/style/capitalization#capitalization-in-titles-and-headings).

That is, capitalize only the first word in the title, the first word in a
subheading after a colon, and any proper nouns or other terms that are
always capitalized a certain way.

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Network request blocking
</td>
<td style="background:#fdd">
Network Request Blocking
</td>
</tr>
<tr style="font-family:monospace">
<td style="background:#dfd">
Blocked response cookies
</td>
<td style="background:#fdd">
blocked response cookies
</td>
</tr>
</table>

### Spell UI elements in text

When mentioning [UI elements in text](https://developers.google.com/style/ui-elements#formatting),
spell their names in bold and exactly as they are spelled, including
capitalization, which should be in sentence case. If an element doesn't have a
name however, <em>don't</em> capitalize its term and <em>don't</em> spell it in
bold.

<table style="width:100%">
<thead style="font-weight:bold">
<tr><td style="width:50%">Good</td><td style="width:50%">Bad</td></tr>
</thead>
<tr style="font-family:monospace">
<td style="background:#dfd">
Open the <b>Network request blocking</b> panel.
</td>
<td style="background:#fdd">
Open the Network request blocking panel.
</td>
</tr>
<tr style="font-family:monospace">
<td style="background:#dfd">
A filter bar at the top of the Network panel.
</td>
<td style="background:#fdd">
A Filter bar at the top of the Network panel.
</td>
</tr>
</table>

*** note
**Tip:** You can "stack" navigation paths in text regardless of element type.
For example:

In **Settings** > **Preferences** > **Appearance** > **Panel layout**,
select `auto`.

That was [Panel] > [Tab] > [Section] > [Drop-down menu].
***

## Resources

1.  How to write UI texts
    ([slides](https://docs.google.com/presentation/d/1AfsX0JaMd1iBNH1WL2dMswXLuhGSU5j2cyAEHkJpoNA?resourcekey=0-cfKK72Q_tV8-uakhzuVx-g),
    [recording](https://drive.google.com/file/d/19wOnbZHvXhH-tQLuE0M2B9fQMjosLC9O?resourcekey=0-FBrvUvnWMq0Wa98vkea9-A))

