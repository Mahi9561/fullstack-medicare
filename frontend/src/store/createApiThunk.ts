import { createAsyncThunk } from '@reduxjs/toolkit';
import { toRejection, type Rejection } from '../utils/errors';

/**
 * createAsyncThunk with one convention: a failure always arrives as a plain `Rejection`
 * ({ message, status, fieldErrors }) in `action.payload`, and `unwrap()` throws that object.
 */
export const createApiThunk = <Returned, Arg = void>(type: string, run: (arg: Arg) => Promise<Returned>) =>
  createAsyncThunk<Returned, Arg, { rejectValue: Rejection }>(type, async (arg, { rejectWithValue }) => {
    try {
      return await run(arg);
    } catch (error) {
      return rejectWithValue(toRejection(error));
    }
  });
