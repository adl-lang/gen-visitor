

export type NameMungFn = (value: string, locale?: string) => string;

export class FileWriter {
  content: string[] = [];
  imports: string[] = [];

  constructor(readonly path: string, readonly verbose: boolean) {
    if (verbose) {
      console.log(`Writing ${path}...`);
    }
    this.content = [];
  }

  register_import(s: string) {
    if( !this.imports.includes(s) ) {
      this.imports.push(s)
    }
  }

  write(s: string) {
    // Deno.stderr.writeSync(new TextEncoder().encode(s))
    // console.log(s)
    this.content.push(s);
  }

  cwrite(f: boolean, s: string) {
    if( f ) {
      this.content.push(s);
    }
  }

  close(): Promise<void|number> {
    if( this.path === "-" ) {
      Deno.stdout.writeSync(new TextEncoder().encode(this.imports.join("")))
      return Deno.stdout.write(new TextEncoder().encode(this.content.join("")))
    }
    return Deno.writeTextFile(this.path, this.imports.join("") + this.content.join(""));
  }
}

