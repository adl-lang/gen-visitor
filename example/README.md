
## Example

```
deno run  --allow-all ./gen-visitor.ts --import_base ./ example.A  > ts/visitor.ts

deno run  --v8-flags=--stack-trace-limit=25 --allow-all ./gen-visitor.ts sys.adlast.Module > ../visitor_gen2.ts
```

