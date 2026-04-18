import {
  assignTags,
  tagDiff,
  groupByTag,
  formatTagReport,
} from './diffTag';

const tagMap = {
  auth: ['user.token', 'user.password'],
  meta: ['*.createdAt', '*.updatedAt'],
};

describe('assignTags', () => {
  it('matches exact path', () => {
    expect(assignTags('user.token', tagMap)).toEqual(['auth']);
  });

  it('matches wildcard pattern', () => {
    expect(assignTags('post.createdAt', tagMap)).toEqual(['meta']);
  });

  it('returns empty for unmatched path', () => {
    expect(assignTags('user.name', tagMap)).toEqual([]);
  });

  it('can match multiple tags', () => {
    const multi = { auth: ['user.*'], meta: ['*.token'] };
    expect(assignTags('user.token', multi)).toEqual(['auth', 'meta']);
  });
});

describe('tagDiff', () => {
  it('tags each entry', () => {
    const entries = [
      { path: 'user.token', change: 'removed' },
      { path: 'user.name', change: 'added' },
    ];
    const result = tagDiff(entries, tagMap);
    expect(result[0].tags).toEqual(['auth']);
    expect(result[1].tags).toEqual([]);
  });
});

describe('groupByTag', () => {
  it('groups paths by tag', () => {
    const tagged = [
      { path: 'user.token', tags: ['auth'] },
      { path: 'user.name', tags: [] },
    ];
    const groups = groupByTag(tagged);
    expect(groups['auth']).toContain('user.token');
    expect(groups['untagged']).toContain('user.name');
  });
});

describe('formatTagReport', () => {
  it('formats groups as labelled sections', () => {
    const report = formatTagReport({ auth: ['user.token'] });
    expect(report).toContain('[auth]');
    expect(report).toContain('user.token');
  });
});
