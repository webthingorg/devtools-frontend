declare module 'ClientVariationsParser' {
    export function parseClientVariations(data: string): {variationIds: number[], triggerVariationIds: number[]}
}
