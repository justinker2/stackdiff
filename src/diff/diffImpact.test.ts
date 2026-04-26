import { assessImpact, classifyImpact, formatImpactReport } from './diffImpact';
import type { DiffEntry } from './shapeDiff';

const makeEntry = (path: string, change: string): DiffEntry =>
  ({ path, change } as DiffEntry);

describe('classifyImpact', () => {
  it('marks removed fields as critical', () => {
    const result = classifyImpact(makeEntry('user.id', 'removed'));
    expect(result.level).toBe('critical');
  });

  it('marks type-changed fields as high', () => {
    const result = classifyImpact(makeEntry('user.age', 'type-changed'));
    expect(result.level).toBe('high');
  });

  it('marks added required fields as high', () => {
    const result = classifyImpact(makeEntry('user.required.email', 'added'));
    expect(result.level).toBe('high');
  });

  it('marks plain added fields as low', () => {
    const result = classifyImpact(makeEntry('user.nickname', 'added'));
    expect(result.level).toBe('low');
  });

  it('marks nullable-changed fields as medium', () => {
    const result = classifyImpact(makeEntry('user.bio', 'nullable-changed'));
    expect(result.level).toBe('medium');
  });

  it('marks unknown changes as none', () => {
    const result = classifyImpact(makeEntry('user.meta', 'description-changed'));
    expect(result.level).toBe('none');
  });
});

describe('assessImpact', () => {
  it('returns correct summary counts', () => {
    const entries = [
      makeEntry('a', 'removed'),
      makeEntry('b', 'added'),
      makeEntry('c', 'type-changed'),
    ];
    const report = assessImpact(entries);
    expect(report.summary.critical).toBe(1);
    expect(report.summary.high).toBe(1);
    expect(report.summary.low).toBe(1);
  });

  it('sets overallLevel to highest severity present', () => {
    const entries = [makeEntry('x', 'added'), makeEntry('y', 'removed')];
    const report = assessImpact(entries);
    expect(report.overallLevel).toBe('critical');
  });

  it('returns none when entries list is empty', () => {
    const report = assessImpact([]);
    expect(report.overallLevel).toBe('none');
  });
});

describe('formatImpactReport', () => {
  it('includes overall level in output', () => {
    const report = assessImpact([makeEntry('a', 'removed')]);
    const text = formatImpactReport(report);
    expect(text).toContain('CRITICAL');
  });

  it('includes field paths in output', () => {
    const report = assessImpact([makeEntry('data.token', 'removed')]);
    const text = formatImpactReport(report);
    expect(text).toContain('data.token');
  });

  it('includes summary section', () => {
    const report = assessImpact([makeEntry('x', 'added')]);
    const text = formatImpactReport(report);
    expect(text).toContain('Summary:');
  });
});
