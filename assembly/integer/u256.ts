import { LOAD, STORE } from 'internal/arraybuffer';

import { i128 } from './i128';
import { u128 } from './u128';
import { u256toa10 } from "../utils";

@lazy const HEX_CHARS = '0123456789abcdef';

export class u256 {

  @inline
  static get Zero(): u256 {
    return new u256();
  }

  @inline
  static get One(): u256 {
    return new u256(1);
  }

  @inline
  static get Min(): u256 {
    return new u256();
  }

  @inline
  static get Max(): u256 {
    return new u256(u64.MAX_VALUE, u64.MAX_VALUE, u64.MAX_VALUE, u64.MAX_VALUE);
  }

  @inline
  static fromU256(value: u256): u256 {
    return new u256(value.lo1, value.lo2, value.hi1, value.hi2);
  }

  @inline
  static fromU128(value: u128): u256 {
    return new u256(value.lo, value.hi);
  }

  @inline
  static fromU64(value: u64): u256 {
    return new u256(value);
  }

  @inline
  static fromI64(value: i64): u256 {
    var mask = value >> 63;
    return new u256(value, mask, mask, mask);
  }

  @inline
  static fromU32(value: u32): u256 {
    return new u256(value);
  }

  @inline
  static fromI32(value: i32): u256 {
    var mask: u64 = value >> 63;
    return new u256(value, mask, mask, mask);
  }

  @inline
  static fromBits(
    l0: u32, l1: u32, l2: u32, l3: u32,
    h0: u32, h1: u32, h2: u32, h3: u32,
  ): u256 {
    return new u256(
      <u64>l0 | ((<u64>l1) << 32),
      <u64>l2 | ((<u64>l3) << 32),
      <u64>h0 | ((<u64>h1) << 32),
      <u64>h2 | ((<u64>h3) << 32),
    );
  }

  @inline
  static fromBytes<T>(array: T, bigEndian: bool = false): u256 {
    if (array instanceof u8[]) {
      return bigEndian ? u256.fromBytesBE(array) : u256.fromBytesLE(array);
    } else if (array instanceof Uint8Array) {
      return bigEndian ? u256.fromUint8ArrayBE(array) : u256.fromUint8ArrayLE(array);
    } else {
      throw new TypeError("Unsupported generic type");
    }
  }

  static fromBytesLE(array: u8[]): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = <ArrayBuffer>array.buffer_;
    return new u256(
      LOAD<u64>(buffer, 0),
      LOAD<u64>(buffer, 1),
      LOAD<u64>(buffer, 2),
      LOAD<u64>(buffer, 3),
    );
  }

  static fromBytesBE(array: u8[]): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = <ArrayBuffer>array.buffer_;
    return new u256(
      bswap<u64>(LOAD<u64>(buffer, 3)),
      bswap<u64>(LOAD<u64>(buffer, 2)),
      bswap<u64>(LOAD<u64>(buffer, 1)),
      bswap<u64>(LOAD<u64>(buffer, 0))
    );
  }

  static fromUint8ArrayLE(array: Uint8Array): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = array.buffer;
    return new u256(
        LOAD<u64>(buffer, 0, array.byteOffset),
        LOAD<u64>(buffer, 1, array.byteOffset),
        LOAD<u64>(buffer, 2, array.byteOffset),
        LOAD<u64>(buffer, 3, array.byteOffset)
    );
  }

  static fromUint8ArrayBE(array: Uint8Array): u256 {
    assert(array.length && (array.length & 31) == 0);
    var buffer = array.buffer;
    return new u256(
        bswap<u64>(LOAD<u64>(buffer, 3, array.byteOffset)),
        bswap<u64>(LOAD<u64>(buffer, 2, array.byteOffset)),
        bswap<u64>(LOAD<u64>(buffer, 1, array.byteOffset)),
        bswap<u64>(LOAD<u64>(buffer, 0, array.byteOffset))
    );
  }

  // TODO need improvement
  // max safe uint for f64 actually 52-bits
  @inline
  static fromF64(value: f64): u256 {
    var mask: u64 = -(value < 0);
    return new u256(<u64>value, mask, mask, mask);
  }

  // TODO need improvement
  // max safe int for f32 actually 23-bits
  @inline
  static fromF32(value: f32): u256 {
    var mask: u64 = -(value < 0);
    return new u256(<u64>value, mask, mask, mask);
  }

  // TODO
  // static fromString(str: string): u256

  constructor(
    public lo1: u64 = 0,
    public lo2: u64 = 0,
    public hi1: u64 = 0,
    public hi2: u64 = 0,
  ) {}

  @inline
  set(value: u256): this {
    this.lo1 = value.lo1;
    this.lo2 = value.lo2;
    this.hi1 = value.hi1;
    this.hi2 = value.hi2;
    return this;
  }

  @inline
  setU128(value: u128): this {
    this.lo1 = value.lo;
    this.lo2 = value.hi;
    this.hi1 = 0;
    this.hi2 = 0;
    return this;
  }

  @inline
  setI64(value: i64): this {
    var mask: u64 = value >> 63;
    this.lo1 = value;
    this.lo2 = mask;
    this.hi1 = mask;
    this.hi2 = mask;
    return this;
  }

  @inline
  setU64(value: u64): this {
    this.lo1 = value;
    this.lo2 = 0;
    this.hi1 = 0;
    this.hi2 = 0;
    return this;
  }

  @inline
  setI32(value: i32): this {
    var mask: u64 = value >> 63;
    this.lo1 = value;
    this.lo2 = mask;
    this.hi1 = mask;
    this.hi2 = mask;
    return this;
  }

  @inline
  setU32(value: u32): this {
    this.lo1 = value;
    this.lo2 = 0;
    this.hi1 = 0;
    this.hi2 = 0;
    return this;
  }

  @inline
  isZero(): bool {
    return !(this.lo1 | this.lo2 | this.hi1 | this.hi2);
  }

  @inline @operator.prefix('!')
  static isEmpty(value: u256): bool {
    return value === null || value.isZero();
  }

  @inline @operator.prefix('~')
  not(): u256 {
    return new u256(~this.lo1, ~this.lo2, ~this.hi1, ~this.hi2);
  }

  @inline @operator.prefix('+')
  pos(): u256 {
    return this;
  }

  @inline @operator.prefix('-')
  neg(): u256 {
    var lo1 = ~this.lo1,
        lo2 = ~this.lo2,
        hi1 = ~this.hi1,
        hi2 = ~this.hi2;

    var cy = ((lo1 & 1) + (lo1 >> 1)) >> 63;
    var cy1 = ((lo2 & 1) + (lo2 >> 1)) >> 63;
    var cy2 = ((hi1 & 1) + (hi1 >> 1)) >> 63;

    return new u256(lo1 + 1, lo2 + cy, hi1 + cy1, hi2 + cy2);
  }

  @inline @operator('+')
  static add(a: u256, b: u256): u256 {
    var alo = a.lo1;
    var blo = b.lo1;
    var lo   = new u128(alo) + new u128(blo);
    var amid = new u128(alo, a.hi1);
    var bmid = new u128(blo, b.hi1);
    var mid  = amid + bmid + new u128(lo.hi);
    var hi   = a.hi2 + b.hi2 + mid.hi;

    return new u256(lo.lo, mid.lo, mid.hi, hi);
  }

  @inline @operator('-')
  static sub(a: u256, b: u256): u256 {
    var alo = a.lo1;
    var blo = b.lo1;
    var lo   = new u128(alo) - new u128(blo);
    var amid = new u128(alo, a.hi1);
    var bmid = new u128(blo, b.hi1);
    var mid  = amid - bmid - new u128(lo.hi);
    var hi   = a.hi2 - b.hi2 - mid.hi;

    return new u256(lo.lo, mid.lo, mid.hi, hi);
  }

  @inline @operator('|')
  static or(a: u256, b: u256): u256 {
    return new u256(a.lo1 | b.lo1, a.lo2 | b.lo2, a.hi1 | b.hi1, a.hi2 | b.hi2);
  }

  @inline @operator('^')
  static xor(a: u256, b: u256): u256 {
    return new u256(a.lo1 ^ b.lo1, a.lo2 ^ b.lo2, a.hi1 ^ b.hi1, a.hi2 ^ b.hi2);
  }

  @inline @operator('&')
  static and(a: u256, b: u256): u256 {
    return new u256(a.lo1 & b.lo1, a.lo2 & b.lo2, a.hi1 & b.hi1, a.hi2 & b.hi2);
  }

  @inline @operator('>>')
  static shr(value: u256, shift: i32): u256 {
    shift &= 255;

    // need for preventing redundant i32 -> u64 extends
    var shift64 = shift as u64;
    var lo1: u64, lo2: u64, hi1: u64, hi2: u64;

    if (shift <= 64) {
      if (shift == 0) return value;
      hi2 =  value.hi2 >> shift64;
      hi1 = (value.hi1 >> shift64) | (hi2 << (64 - shift64));
      lo2 = (value.lo2 >> shift64) | (hi1 << (64 - shift64));
      lo1 = (value.lo1 >> shift64) | (lo2 << (64 - shift64));
      return new u256(lo1, lo2, hi1, hi2);
    } else if (shift > 64 && shift <= 128) {
      hi1 = value.hi2 >> (128 - shift64);
      return new u256(value.lo2, value.hi1, hi1);
    } else if (shift > 128 && shift <= 192) {
      lo2 = value.hi2 >> (192 - shift);
      return new u256(value.hi1, lo2);
    } else {
      return new u256(value.hi2 >> (256 - shift64));
    }
  }

  @inline @operator('>>>')
  static shr_u(value: u256, shift: i32): u256 {
    return u256.shr(value, shift);
  }

  @inline @operator('==')
  static eq(a: u256, b: u256): bool {
    return a.lo1 == b.lo1 && a.lo2 == b.lo2 && a.hi1 == b.hi1 && a.hi2 == b.hi2;
  }

  @inline @operator('!=')
  static ne(a: u256, b: u256): bool {
    return !u256.eq(a, b);
  }

  @inline @operator('<')
  static lt(a: u256, b: u256): bool {
    var ah2 = a.hi2, ah1 = a.hi1, bh2 = b.hi2, bh1 = b.hi1, al2 = a.lo2, bl2 = b.lo2;
    if (ah2 == bh2) {
      if (ah1 == bh1) {
        return al2 == bl2 ? a.lo1 < b.lo1 : al2 < bl2
      } else {
        return ah1 < bh1;
      }
    } else {
      return ah2 < bh2;
    }
  }

  @inline @operator('>')
  static gt(a: u256, b: u256): bool {
    return b < a;
  }

  @inline @operator('<=')
  static le(a: u256, b: u256): bool {
    return !u256.gt(a, b);
  }

  @inline @operator('>=')
  static ge(a: u256, b: u256): bool {
    return !u256.lt(a, b);
  }

  @inline
  static popcnt(value: u256): i32 {
    var count = popcnt(value.lo1);
    if (value.lo2) count += popcnt(value.lo2);
    if (value.hi1) count += popcnt(value.hi1);
    if (value.hi2) count += popcnt(value.hi2);
    return <i32>count;
  }

  @inline
  static clz(value: u256): i32 {
         if (value.hi2) return <i32>(clz(value.hi2) + 0);
    else if (value.hi1) return <i32>(clz(value.hi1) + 64);
    else if (value.lo2) return <i32>(clz(value.lo2) + 128);
    else                return <i32>(clz(value.lo1) + 192);
  }

  @inline
  static ctz(value: u256): i32 {
         if (value.lo1) return <i32>(ctz(value.lo1) + 0);
    else if (value.lo2) return <i32>(ctz(value.lo2) + 64);
    else if (value.hi1) return <i32>(ctz(value.hi1) + 128);
    else                return <i32>(ctz(value.hi2) + 192);
  }

  /**
   * Convert to 128-bit signed integer
   * @return 256-bit signed integer
   */
  @inline
  toI128(): i128 {
    return new i128(
      this.lo1,
      (this.lo2 & 0x7FFFFFFFFFFFFFFF) |
      (this.hi2 & 0x8000000000000000)
    );
  }

  /**
   * Convert to 128-bit unsigned integer
   * @return 128-bit unsigned integer
   */
  @inline
  toU128(): u128 {
    return new u128(this.lo1, this.lo2);
  }

  /**
   * Convert to 64-bit signed integer
   * @return 64-bit signed integer
   */
  @inline
  toI64(): i64 {
    return <i64>(
      (this.lo1 & 0x7FFFFFFFFFFFFFFF) |
      (this.hi2 & 0x8000000000000000)
    );
  }

  /**
   * Convert to 64-bit unsigned integer
   * @return 64-bit unsigned integer
   */
  @inline
  toU64(): u64 {
    return this.lo1;
  }

  /**
   * Convert to 32-bit signed integer
   * @return 32-bit signed integer
   */
  @inline
  toI32(): i32 {
    return <i32>this.toI64();
  }

  /**
   * Convert to 32-bit unsigned integer
   * @return 32-bit unsigned integer
   */
  @inline
  toU32(): u32 {
    return <u32>this.lo1;
  }

  /**
   * Convert to 1-bit boolean
   * @return 1-bit boolean
   */
  @inline
  toBool(): bool {
    return <bool>(this.lo1 | this.lo2 | this.hi1 | this.hi2);
  }

  private toArrayBufferLE(buffer: ArrayBuffer): void {
    STORE<u64>(buffer, 0, this.lo1);
    STORE<u64>(buffer, 1, this.lo2);
    STORE<u64>(buffer, 2, this.hi1);
    STORE<u64>(buffer, 3, this.hi2);
  }

  private toArrayBufferBE(buffer: ArrayBuffer): void {
    STORE<u64>(buffer, 0, bswap(this.hi2));
    STORE<u64>(buffer, 1, bswap(this.hi1));
    STORE<u64>(buffer, 2, bswap(this.lo2));
    STORE<u64>(buffer, 3, bswap(this.lo1));
  }

  private toArrayBuffer(buffer: ArrayBuffer, bigEndian: bool = false): void {
    if (bigEndian) {
      this.toArrayBufferBE(buffer);
    } else {
      this.toArrayBufferLE(buffer);
    }
  }

  /**
   * Convert to byte array
   * @param le Little or Big Endian? Default: true
   * @returns  Array of bytes
   */
  @inline
  toBytes(bigEndian: bool = false): u8[] {
    var result = new Array<u8>(32);
    var buffer = <ArrayBuffer>result.buffer_;
    this.toArrayBuffer(buffer, bigEndian);
    return result;
  }

  /**
   * Convert to Uint8Array
   * @param le Little or Big Endian? Default: true
   * @returns  Uint8Array
   */
  @inline
  toUint8Array(bigEndian: bool = false): Uint8Array {
    var result = new Uint8Array(32);
    var buffer = <ArrayBuffer>result.buffer;
    this.toArrayBuffer(buffer, bigEndian);
    return result;
  }

  @inline
  clone(): u256 {
    return new u256(this.lo1, this.lo2, this.hi1, this.hi2);
  }

  toString(radix: i32 = 0): string {
    if (!radix) radix = 10;
    assert(radix == 10 || radix == 16, 'radix argument must be between 10 or 16');

    if (this.isZero()) return '0';

    var result = '';
    var it = this.clone();
    if (radix == 16) {
      let shift: i32 = 252 - (u256.clz(it) & ~3);
      while (shift >= 0) {
        it >>= shift;
        result = result.concat(HEX_CHARS.charAt(<i32>(it.lo1 & 15)));
        shift -= 4;
      }
      return result;
    } else if (radix == 10) {
      return u256toa10(this);
    }
    return "undefined";
  }
}
