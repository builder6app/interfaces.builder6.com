export class SnippetVersion {
  _id?: string;
  snippetId: string;
  code: string;
  versionId: string;

  // Steedos Standard Fields
  owner?: string;
  created: Date;
  created_by?: string;
  modified?: Date;
  modified_by?: string;
}
