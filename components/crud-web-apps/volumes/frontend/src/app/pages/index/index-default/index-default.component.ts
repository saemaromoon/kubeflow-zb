import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
	NamespaceService,
	ActionEvent,
	ConfirmDialogService,
	ExponentialBackoff,
	STATUS_TYPE,
	DIALOG_RESP,
	DialogConfig,
	SnackBarService,
	SnackType,
	ToolbarButton,
} from 'kubeflow';
import { defaultConfig } from './config';
import { environment } from '@app/environment';
import { VWABackendService } from 'src/app/services/backend.service';
import { PVCResponseObject, PVCProcessedObject } from 'src/app/types';
import { Subscription, Observable, Subject } from 'rxjs';
import { isEqual } from 'lodash';
import { FormDefaultComponent } from '../../form/form-default/form-default.component';

@Component({
	selector: 'app-index-default',
	templateUrl: './index-default.component.html',
	styleUrls: ['./index-default.component.scss'],
})
export class IndexDefaultComponent implements OnInit {
	public env = environment;
	public poller: ExponentialBackoff;

	public currLocation = 'bW9kZWxz';
	public subs = new Subscription();

	public config = defaultConfig;
	public rawData: PVCResponseObject[] = [];
	public processedData: PVCProcessedObject[] = [];
	public pvcsWaitingViewer = new Set<string>();

	buttons: ToolbarButton[] = [
		new ToolbarButton({
			text: `Upload Model`,
			icon: 'add',
			stroked: true,
			disabled: true,
			fn: () => {
				this.newResourceClicked();
			},
		}),
	];

	constructor(
		public ns: NamespaceService,
		public confirmDialog: ConfirmDialogService,
		public backend: VWABackendService,
		public dialog: MatDialog,
		public snackBar: SnackBarService,
	) { }

	ngOnInit() {
		this.poller = new ExponentialBackoff({ interval: 10000, retries: 3 });

		// Poll for new data and reset the poller if different data is found
		this.subs.add(
			this.poller.start().subscribe(() => {
				if (!this.currLocation) {
					return;
				}

				this.backend.getModels(this.currLocation).subscribe(pvcs => {
					if (!isEqual(this.rawData, pvcs)) {
						this.rawData = pvcs;

						// Update the frontend's state
						this.processedData = this.parseIncomingData(pvcs);
						this.poller.reset();
					}
				});
				// this.backend.getPVCs(this.currNamespace).subscribe(pvcs => {
				//   if (!isEqual(this.rawData, pvcs)) {
				//     this.rawData = pvcs;

				//     // Update the frontend's state
				//     this.processedData = this.parseIncomingData(pvcs);
				//     this.poller.reset();
				//   }
				// });

			}),
		);

		// Reset the poller whenever the selected namespace changes
		// this.subs.add(
		// 	this.ns.getSelectedNamespace().subscribe(ns => {
		// 		this.currNamespace = ns;
		// 		this.pvcsWaitingViewer = new Set<string>();
		// 		this.poller.reset();
		// 	}),
		// );
	}

	public reactToAction(a: ActionEvent) {
		// console.log(a.data)
		switch (a.action) {
			case 'delete':
				this.deleteVolumeClicked(a.data);
				break;
			case 'moveto':
				this.moveToClicked(a.data);
				break;
		}
	}
	public moveToClicked(model: PVCProcessedObject) {
		var newloc = model.class.split('s3://zigbang-mlops/')[1];
		// newloc = newloc.replace("/", "%");
		// newloc = encodeURIComponent(newloc)
		newloc = btoa(newloc);
		this.currLocation = newloc
		console.log(this.currLocation)
		this.backend.getModels(this.currLocation).subscribe(pvcs => {
			if (!isEqual(this.rawData, pvcs)) {
				this.rawData = pvcs;
				// Update the frontend's state
				this.processedData = this.parseIncomingData(pvcs);
			}
		});
	}
	public deleteVolumeClicked(pvc: PVCProcessedObject) {
		const deleteDialogConfig: DialogConfig = {
			title: $localize`Are you sure you want to delete this volume? ${pvc.name}`,
			message: $localize`Warning: All data in this volume will be lost.`,
			accept: $localize`DELETE`,
			confirmColor: 'warn',
			cancel: $localize`CANCEL`,
			error: '',
			applying: $localize`DELETING`,
			width: '600px',
		};

		const ref = this.confirmDialog.open(pvc.name, deleteDialogConfig);
		const delSub = ref.componentInstance.applying$.subscribe(applying => {
			if (!applying) {
				return;
			}

			// Close the open dialog only if the DELETE request succeeded
			// this.backend.deletePVC(this.currNamespace, pvc.name).subscribe({
			// 	next: _ => {
			// 		this.poller.reset();
			// 		ref.close(DIALOG_RESP.ACCEPT);
			// 	},
			// 	error: err => {
			// 		// Simplify the error message
			// 		const errorMsg = err;
			// 		deleteDialogConfig.error = errorMsg;
			// 		ref.componentInstance.applying$.next(false);
			// 	},
			// });

			// DELETE request has succeeded
			ref.afterClosed().subscribe(res => {
				delSub.unsubscribe();
				if (res !== DIALOG_RESP.ACCEPT) {
					return;
				}

				pvc.status.phase = STATUS_TYPE.TERMINATING;
				pvc.status.message = 'Preparing to delete the Volume...';
				pvc.deleteAction = STATUS_TYPE.UNAVAILABLE;
				this.pvcsWaitingViewer.delete(pvc.name);
			});
		});
	}

	// Functions for handling the action events
	public newResourceClicked() {
		const ref = this.dialog.open(FormDefaultComponent, {
			width: '600px',
			panelClass: 'form--dialog-padding',
		});

		ref.afterClosed().subscribe(res => {
			if (res === DIALOG_RESP.ACCEPT) {
				this.snackBar.open(
					$localize`Volume was submitted successfully.`,
					SnackType.Success,
					2000,
				);
				this.poller.reset();
			}
		});
	}


	// Utility funcs
	public parseIncomingData(pvcs: PVCResponseObject[]): PVCProcessedObject[] {
		const pvcsCopy = JSON.parse(JSON.stringify(pvcs)) as PVCProcessedObject[];

		// export interface PVCProcessedObject extends PVCResponseObject {
		// 	deleteAction?: string;
		// 	editAction?: string;
		// 	ageValue?: string;
		// 	ageTooltip?: string;
		//   }

		for (const pvc of pvcsCopy) {
			pvc.deleteAction = this.parseDeletionActionStatus(pvc);
			pvc.connectAction = this.processConnectActionStatus(pvc);

			pvc.ageValue = pvc.age.uptime;
			pvc.ageTooltip = pvc.age.timestamp;
		}

		return pvcsCopy;
	}

	public processConnectActionStatus(pvc: PVCProcessedObject) {
		if (pvc.status.phase !== STATUS_TYPE.READY) {
			return STATUS_TYPE.UNAVAILABLE;
		}
		if (pvc.modes == ['file']) {
			return STATUS_TYPE.UNAVAILABLE;
		}
		return STATUS_TYPE.READY;
	}
	public parseDeletionActionStatus(pvc: PVCProcessedObject) {
		return STATUS_TYPE.UNAVAILABLE;

		if (pvc.status.phase !== STATUS_TYPE.TERMINATING) {
			return STATUS_TYPE.READY;
		}

		return STATUS_TYPE.TERMINATING;
	}

	public pvcTrackByFn(index: number, pvc: PVCProcessedObject) {
		return `${pvc.name}/${pvc.namespace}/${pvc.capacity}`;
	}
}
