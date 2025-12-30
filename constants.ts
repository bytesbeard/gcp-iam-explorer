
import { Scenario, NodeType } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'deep-inheritance',
    title: 'Deep Hierarchy Inheritance',
    description: 'Permissions flow down through multiple folder layers. Roles granted at the top are cumulative.',
    initialNodes: [
      { id: 'org', name: 'Global Corp', type: NodeType.ORGANIZATION, depth: 0 },
      { id: 'f-prod', name: 'Production Folder', type: NodeType.FOLDER, parentId: 'org', depth: 1 },
      { id: 'f-app', name: 'App Team Folder', type: NodeType.FOLDER, parentId: 'f-prod', depth: 2 },
      { id: 'p-backend', name: 'Backend Project', type: NodeType.PROJECT, parentId: 'f-app', depth: 3 },
      { id: 'u-lead', name: 'Lead Dev', type: NodeType.USER, depth: 4 }
    ],
    initialPolicy: {
      'org': { version: 1, bindings: [] },
      'p-backend': { version: 1, bindings: [] }
    },
    actionLabel: 'Grant Folder Viewer',
    actionDescription: 'Grant the Lead Dev "roles/viewer" at the Production Folder level.'
  },
  {
    id: 'service-accounts',
    title: 'Service Accounts & Workload Identity',
    description: 'Understand how users can "Act As" service accounts to grant applications specific identities.',
    initialNodes: [
      { id: 'org', name: 'Dev Org', type: NodeType.ORGANIZATION, depth: 0 },
      { id: 'p-data', name: 'Data Project', type: NodeType.PROJECT, parentId: 'org', depth: 1 },
      { id: 'sa-loader', name: 'loader-sa', type: NodeType.SERVICE_ACCOUNT, parentId: 'p-data', depth: 2 },
      { id: 'u-dev', name: 'Developer', type: NodeType.USER, depth: 1 }
    ],
    initialPolicy: {
      'p-data': { 
        version: 1, 
        bindings: [{ role: 'roles/storage.objectViewer', members: ['serviceAccount:loader-sa@p-data.iam.gserviceaccount.com'] }] 
      }
    },
    actionLabel: 'Grant ServiceAccountUser',
    actionDescription: 'Grant the Developer "roles/iam.serviceAccountUser" on the Service Account node.'
  },
  {
    id: 'iam-deny',
    title: 'IAM Deny Policies',
    description: 'Deny policies take precedence over all Allow policies, regardless of where they are in the hierarchy.',
    initialNodes: [
      { id: 'org', name: 'Secure Corp', type: NodeType.ORGANIZATION, depth: 0 },
      { id: 'p-hr', name: 'HR Data Project', type: NodeType.PROJECT, parentId: 'org', depth: 1 },
      { id: 'u-contractor', name: 'Contractor', type: NodeType.USER, depth: 1 }
    ],
    initialPolicy: {
      'p-hr': { 
        version: 1, 
        bindings: [{ role: 'roles/editor', members: ['user:contractor@example.com'] }] 
      }
    },
    actionLabel: 'Apply Org Deny Policy',
    actionDescription: 'Apply a Deny policy at the Org level to prevent the Contractor from deleting any resources.',
    denyPolicy: true
  },
  {
    id: 'iam-conditions',
    title: 'Conditional Access',
    description: 'Grant access based on attributes like time, resource tags, or request source IP.',
    initialNodes: [
      { id: 'org', name: 'Cloud Org', type: NodeType.ORGANIZATION, depth: 0 },
      { id: 'p-test', name: 'Test Project', type: NodeType.PROJECT, parentId: 'org', depth: 1 },
      { id: 'u-intern', name: 'Intern', type: NodeType.USER, depth: 2 }
    ],
    initialPolicy: {
      'p-test': { version: 1, bindings: [] }
    },
    actionLabel: 'Grant Business Hours Only',
    actionDescription: 'Grant "roles/viewer" to the Intern, but only if the request is within Business Hours.'
  }
];

export const ROLE_DETAILS: Record<string, { title: string; permissions: string[] }> = {
  'roles/viewer': {
    title: 'Viewer',
    permissions: ['resourcemanager.projects.get', 'storage.buckets.list']
  },
  'roles/editor': {
    title: 'Editor',
    permissions: ['storage.objects.create', 'compute.instances.start']
  },
  'roles/iam.serviceAccountUser': {
    title: 'Service Account User',
    permissions: ['iam.serviceAccounts.actAs']
  },
  'roles/storage.objectViewer': {
    title: 'Storage Object Viewer',
    permissions: ['storage.objects.get', 'storage.objects.list']
  }
};
