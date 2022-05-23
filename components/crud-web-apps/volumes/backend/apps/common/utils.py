import datetime
from kubeflow.kubeflow.crud_backend import api, helpers

from . import status


def parse_model(model):
    """  
    Process the model and format it as the UI expects it.
    """
    """
    {
        'Key': 'zigbang-mlops/models/', 
        'LastModified': datetime.datetime(2022, 5, 9, 6, 54, 28, tzinfo=tzutc()), 
        'ETag': '"d41d8cd98f00b204e9800998ecf8427e"', 
        'Size': 0, 
        'StorageClass': 'STANDARD', 
        'type': 'file', 
        'size': 0, 
        'name': 'zigbang-mlops/models/'
    }
    {
        'Key': 'zigbang-mlops/models/test', 
        'Size': 0, 
        'StorageClass': 'DIRECTORY', 
        'type': 'directory', 
        'size': 0, 
        'name': 'zigbang-mlops/models/test'
    }
    """

    name = model.get('name').rsplit('/', 1)[1]
    if model.get('type') == 'directory':
        name = name + '/'
    if model.get('type') == 'file' and name == '':
        name = '/'
    # print(name, model.get('type'), model.get('type') == 'directory')

    parsed_model = {
        "name": name,
        "namespace": '',
        "status": {
            "message": "Bound",
            "phase": "ready",
            "state": ""
        },
        "age": {
            "uptime": helpers.get_uptime(model.get('LastModified', datetime.datetime(1900, 1, 1))) if model.get('type') == 'file' else '-',
            "timestamp": model.get('LastModified', datetime.datetime(1900, 1, 1)).strftime("%d/%m/%Y, %H:%M:%S"),
        },
        "capacity": str(round(model.get('size') / 1024.0**2, 2)) + ' MB' if model.get('size') != 0 else '-',
        "modes": model.get('type'),
        "class": "s3://" + model.get('name'),
    }

    return parsed_model


def parse_pvc(pvc):
    """
    pvc: client.V1PersistentVolumeClaim

    Process the PVC and format it as the UI expects it.
    """
    try:
        capacity = pvc.status.capacity["storage"]
    except Exception:
        capacity = pvc.spec.resources.requests["storage"]

    parsed_pvc = {
        "name": pvc.metadata.name,
        "namespace": pvc.metadata.namespace,
        "status": status.pvc_status(pvc),
        "age": {
            "uptime": helpers.get_uptime(pvc.metadata.creation_timestamp),
            "timestamp": pvc.metadata.creation_timestamp.strftime(
                "%d/%m/%Y, %H:%M:%S"
            ),
        },
        "capacity": capacity,
        "modes": pvc.spec.access_modes,
        "class": pvc.spec.storage_class_name,
    }

    return parsed_pvc


def get_pods_using_pvc(pvc, namespace):
    """
    Return a list of Pods that are using the given PVC
    """
    pods = api.list_pods(namespace)
    mounted_pods = []

    for pod in pods.items:
        pvcs = get_pod_pvcs(pod)
        if pvc in pvcs:
            mounted_pods.append(pod)

    return mounted_pods


def get_pod_pvcs(pod):
    """
    Return a list of PVC name that the given Pod
    is using. If it doesn't use any, then an empty list will
    be returned.
    """
    pvcs = []
    if not pod.spec.volumes:
        return []

    vols = pod.spec.volumes
    for vol in vols:
        # Check if the volume is a pvc
        if not vol.persistent_volume_claim:
            continue

        pvcs.append(vol.persistent_volume_claim.claim_name)

    return pvcs
