import { canonicalJson } from './license-canonical-json';

describe('canonicalJson', () => {
  it('sorts object keys recursively and preserves array order', () => {
    expect(canonicalJson({ z: 1, a: { y: true, b: null }, list: [2, 1] }))
      .toBe('{"a":{"b":null,"y":true},"list":[2,1],"z":1}');
  });

  it('rejects values that are not valid JSON data', () => {
    expect(() => canonicalJson(Number.NaN)).toThrow();
    expect(() => canonicalJson(undefined)).toThrow();
  });
});
