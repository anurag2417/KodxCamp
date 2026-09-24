import mongoose, { Schema } from 'mongoose';

/**
 * Monotonic sequence source for `Problem.problemId`.
 *
 * One document per named counter. Two counters are in use:
 *   - `problem_programming` -> 10000 base, increments to 10001, 10002, ...
 *   - `problem_sql`         -> 20000 base, increments to 20001, 20002, ...
 *
 * Allocation is atomic: `findOneAndUpdate({_id}, {$inc:{seq:1}}, {upsert:true, new:true})`
 * returns the post-increment value. Concurrent callers get distinct numbers.
 *
 * NOTE ON TYPES: Mongoose's default `Document` interface hard-codes
 * `_id: ObjectId`. Since this collection uses a string _id (the
 * counter name), we describe the shape with a plain interface and let
 * Mongoose infer the document type from the schema. Do not extend
 * `Document` here - it will fail to type-check.
 */
export interface CounterShape {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterShape>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = mongoose.model<CounterShape>('Counter', counterSchema);