import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const MirrorPeerModel: K8sModel = {
  apiVersion: 'v1alpha1',
  apiGroup: 'multicluster.odf.openshift.io',
  kind: 'MirrorPeer',
  plural: 'mirrorpeers',
  label: 'MirrorPeer',
  labelPlural: 'MirrorPeers',
  crd: true,
  abbr: 'MP',
  namespaced: false,
};
