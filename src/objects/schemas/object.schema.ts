export class Builder6Object {
  _id?: string;
  projectId?: string; // Add this
  name: string;
  label: string;
  description?: string;
  icon?: string;
  schema: string; // The YAML content
  owner?: string;
  created: Date;
  modified: Date;
}
