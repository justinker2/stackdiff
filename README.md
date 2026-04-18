# stackdiff

> CLI tool to compare API response shapes across environments or versions

## Installation

```bash
npm install -g stackdiff
```

## Usage

Compare API responses between two environments:

```bash
stackdiff https://api.staging.example.com/users https://api.prod.example.com/users
```

Compare with custom headers or output format:

```bash
stackdiff https://api.v1.example.com/orders https://api.v2.example.com/orders \
  --header "Authorization: Bearer <token>" \
  --format json
```

**Example output:**

```
~ response.data.items[0]
  + discount_percent (number)
  - legacy_id (string)
  ~ price (string → number)
```

### Options

| Flag | Description |
|------|-------------|
| `--header, -H` | Add a request header |
| `--format` | Output format: `text` (default) or `json` |
| `--depth` | Max depth for shape comparison (default: `5`) |
| `--ignore` | Comma-separated list of keys to ignore |

## Development

```bash
git clone https://github.com/yourname/stackdiff.git
cd stackdiff
npm install
npm run build
```

## License

MIT © 2024