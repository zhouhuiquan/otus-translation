export class XmlParser {
  private _parser: DOMParser =
    typeof DOMParser === 'undefined' ? new (require('xmldom').DOMParser)() : new DOMParser();

  parse(content: string): Document {
    return this._parser.parseFromString(content, 'text/xml');
  }
}
