from ast import parse
from kubeflow.kubeflow.crud_backend import api, logging

from ...common import utils
from . import bp
import s3fs

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/pvcs")
def get_pvcs(namespace):
    # Return the list of PVCs
    pvcs = api.list_pvcs(namespace)
    content = [utils.parse_pvc(pvc) for pvc in pvcs.items]

    return api.success_response("pvcs", content)


@bp.route("/api/namespaces/<currlocation>")
def get_models(currlocation):
    print("============================")
    print("baaa!!!!", currlocation)
    print("============================")
    fs = s3fs.S3FileSystem()
    items = fs.ls('s3://zigbang-mlops/' + currlocation.replace('%', '/'),
                  refresh=True, detail=True)

    content = [utils.parse_model(item) for item in items]
    # Return the list of Models
    # parsed_pvc = {
    #     "age": {
    #         "timestamp": "03/05/2022, 17:09:54",
    #         "uptime": "5 days ago"
    #     },
    #     "capacity": "10Gi",
    #     "class": "kf-efs-sc",
    #     "modes": [
    #         "ReadWriteMany"
    #     ],
    #     "name": "batch-inference-loyalty-7gjvl-kale-marshal-pvc",
    #     "namespace": "kubeflow-de-zigbang-com",
    #     "status": {
    #         "message": "Bound",
    #         "phase": "ready",
    #         "state": ""
    #     }
    # }
    # content = [parsed_pvc]
    from flask import jsonify
    resp = {"status": 200, "success": True, "user": "test!!"}
    resp["pvcs"] = content
    return jsonify(resp)
    # return api.success_response("pvcs", content)
