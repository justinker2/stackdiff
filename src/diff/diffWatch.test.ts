import { startWatch, WatchResult } from './diffWatch';
import * as indexMod from './index';
import * as historyMod from './diffHistory';
import * as cacheMod from './diffCache';

jest.mock('./index');
jest.mock('./diffHistory');
jest.mock('./diffCache');

const mockCompare = indexMod.compareResponses as jest.Mock;
const mockAppend = historyMod.appendHistory as jest.Mock;
const mockWrite = cacheMod.writeCache as jest.Mock;

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 50));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockCompare.mockResolvedValue({ added: [], removed: [], changed: [] });
  mockAppend.mockResolvedValue(undefined);
  mockWrite.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('calls compareResponses on start', async () => {
  const handle = startWatch({ urlA: 'http://a.com', urlB: 'http://b.com', intervalMs: 5000, maxRuns: 1 });
  jest.runAllTimers();
  await flushPromises();
  expect(mockCompare).toHaveBeenCalledWith('http://a.com', 'http://b.com', {}, {});
  handle.stop();
});

test('invokes onDiff callback with result', async () => {
  const onDiff = jest.fn();
  mockCompare.mockResolvedValue({ added: ['x'], removed: [], changed: [] });
  const handle = startWatch({ urlA: 'http://a.com', urlB: 'http://b.com', intervalMs: 5000, maxRuns: 1, onDiff });
  jest.runAllTimers();
  await flushPromises();
  expect(onDiff).toHaveBeenCalledWith(expect.objectContaining({ hasChanges: true, added: ['x'] }));
  handle.stop();
});

test('does not write cache when no changes', async () => {
  const handle = startWatch({ urlA: 'http://a.com', urlB: 'http://b.com', intervalMs: 5000, maxRuns: 1 });
  jest.runAllTimers();
  await flushPromises();
  expect(mockWrite).not.toHaveBeenCalled();
  handle.stop();
});

test('stop prevents further runs', async () => {
  const handle = startWatch({ urlA: 'http://a.com', urlB: 'http://b.com', intervalMs: 1000 });
  handle.stop();
  jest.runAllTimers();
  await flushPromises();
  expect(handle.runCount()).toBeLessThanOrEqual(1);
});
