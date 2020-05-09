# DNS over HTTPS resolver in a Cloudflare Worker

This creates an extensible DNS over HTTPS resolver.
The default configuration proxies all regular TLDs to Cloudflare DNS. All domains includes in `.txt` files under [lists](./lists) are going to be blacklisted.

A version is available at [eggplant.sandwich.workers.dev](https://eggplant.sandwich.workers.dev).
You can see it working using curl
```bash
curl -H 'accept: application/dns-json' 'https://eggplant.sandwich.workers.dev?name=cloudflare.com&type=AAAA'
```

## Development

### Requirements
+ Node >= 12
+ yarn/npm. This tutorial is using yarn
+ cloudflared (only for local resolution)

### Starting the instance locally

Starting cloudflare worker locally on port :8787
```bash
yarn start
```

If you would like to use this DoH service as a local DNS server
```bash
# This might require admin permission for port `53`
cloudflared proxy-dns --upstream 'http://localhost:8787'
```

You can then resolves DNS using dig
```bash
dig @127.0.0.1 cloudflare.com AAAA
```

### Tests

Tests are defined using [Jest](https://jestjs.io/) in [__tests__](./__tests__).
To launch them, run the following
```bash
yarn test
```
Tests includes:
+ Linting
+ Unit Tests
+ Coverage report


### Documentation

The project is using TypeScript and TypeDoc to document the source code. To generate the documentation as HTML, use
```bash
yarn documentation
```

## Deployment

To deploy this Worker on your own Cloudflare account, you have to configure the deployment in [wrangler.toml](./wrangler.toml). The documentation is available on [Github](https://github.com/cloudflare/wrangler).

To run the deployment, you can run
```bash
yarn deploy
```
