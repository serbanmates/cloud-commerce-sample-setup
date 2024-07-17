// Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { BaseSiteService } from '@spartacus/core';
import { DatePipe } from '@angular/common';
import {
  TmaActionType,
  TmaChecklistAction,
  TmaChecklistActionType,
  TmaProcessType,
  TmaProcessTypeEnum, TmaServiceProviderDetails
} from '../../../core/model';
import { TmaChecklistActionService } from '../../../core/checklistaction/facade';
import {
  LOCAL_STORAGE,
  TmaChecklistActionAction,
  TmaChecklistActionsState,
  TmaChecklistActionTypeCheckService,
  TmaConstantResourceModel
} from '../../../core';
import { Store } from '@ngrx/store';
import * as events from 'events';

const { MOVE,
  SWITCH_PROVIDER
} = LOCAL_STORAGE.REASON_FOR_PURCHASE;

@Component({
  selector: 'cx-purchase-reason',
  templateUrl: './tma-purchase-reason.component.html',
  styleUrls: ['./tma-purchase-reason.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TmaPurchaseReasonComponent implements OnInit, OnDestroy {

  @Input()
  contractStartDate: string;

  @Input()
  serviceProvider: string;

  @Input()
  selectedReasonPurchase: string;

  @Input()
  compact: boolean;

  @Input()
  isReadOnly: boolean;

  @Input()
  isSelectedReasonPurchase: boolean = false;

  @Input()
  productCode: string;

  @Input()
  entryNumber: number;

  @Input()
  processType?: TmaProcessType;

  @Input()
  enableChecklistActions?: boolean = true;

  @Input()
  showEdit?: boolean;

  @Output()
  moveIn = new EventEmitter<any>();

  @Output()
  switchProvider = new EventEmitter<any>();

  @Output()
  updateProvider = new EventEmitter<any>();

  @Output()
  updateContractStartDate = new EventEmitter<any>();

  @Output()
  updateServiceProvider = new EventEmitter<any>();

  @ViewChild('serviceProviderButton', { static: false })
  serviceProviderButton: ElementRef;

  @ViewChild('serviceProviderInput', { static: false })
  serviceProviderInput: ElementRef;

  checklistAction$: Observable<TmaChecklistAction[]>;

  minDate: Date;
  maxDate: Date;
  updatedContractStartDateEvent: typeof events.EventEmitter;

  isEdit: boolean = false;

  protected baseSiteId: string;
  protected subscription = new Subscription();

  constructor(
    protected baseSiteService: BaseSiteService,
    protected tmaChecklistActionService: TmaChecklistActionService,
    protected datePipe: DatePipe,
    protected checklistActionTypeCheckService: TmaChecklistActionTypeCheckService,
    protected store: Store<TmaChecklistActionsState>
  ) {
  }

  ngOnInit(): void {
    this.minDate = new Date();
    this.maxDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1000);
    this.subscription.add(
      this.baseSiteService.getActive()
        .subscribe((baseSiteId: string) => this.baseSiteId = baseSiteId)
    );
    if (!this.selectedReasonPurchase) {
      this.selectedReasonPurchase = MOVE;
    }
    if (this.enableChecklistActions) {
      this.checklistAction$ = this.tmaChecklistActionService
          .getChecklistActionForProductCode(
              this.baseSiteId,
              this.productCode
          );
    }
    else {
      this.checklistAction$ = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Emits an event for the move radio button state
   */
  onMoveInChecked(): void {
    this.selectedReasonPurchase = MOVE;
  }

  /**
   * Emits an event for the switch provider radio button state
   */
  onSwitchProviderChecked(): void {
    this.selectedReasonPurchase = SWITCH_PROVIDER;
  }

  /**
   * Emits an event with the updated contract start date
   *
   * @param event - user input event
   */
  onUpdateContractStartDate(event: Event) {
    this.updatedContractStartDateEvent = event;
  }

  /**
   * Check if the installation address action type is provided
   *
   * @param checklistActionList - list of checklist actions
   * @param type - checklist action type
   * @return True if the checklist type is found in the checklist actions list, otherwise false
   */
  hasChecklistActionOfType(checklistActionList: TmaChecklistAction[], type: TmaChecklistActionType): boolean {
    return this.checklistActionTypeCheckService.hasChecklistActionOfType(checklistActionList, type);
  }

  /**
   * Enables/disables the 'Yes' button if the service provider input changes
   */
  updateServiceProviderButton(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.serviceProviderButton.nativeElement.disabled = inputElement.value === '';
  }

  /**
   * Get the checklist action type
   *
   * @return A {@link TmaChecklistActionType}
   */
  get checklistActionType(): typeof TmaChecklistActionType {
    return TmaChecklistActionType;
  }

  /**
   * Toggle the reason for purchase form
   */
  displayReasonForPurchaseForm() {
    this.isEdit = !this.isEdit;
  }

  /**
   * Save the reason for purchase
   */
  saveReasonForPurchase() {
    const serviceProviderPayload: TmaServiceProviderDetails = {
      contractDate: undefined,
      processType: undefined,
      serviceProviderName: undefined
    }
    this.isEdit = !this.isEdit;
    this.isSelectedReasonPurchase = true;
    let contractDate;
    if (this.updatedContractStartDateEvent !== undefined) {
      contractDate = this.datePipe.transform((this.updatedContractStartDateEvent.target as HTMLInputElement).value, 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
    }
    if (this.selectedReasonPurchase === SWITCH_PROVIDER && this.serviceProviderInput?.nativeElement.value) {
      this.serviceProvider = this.serviceProviderInput?.nativeElement?.value;
    }
    if (this.processType !== undefined) {
      serviceProviderPayload.contractDate = contractDate;
      if (this.selectedReasonPurchase === SWITCH_PROVIDER && this.serviceProvider) {
        serviceProviderPayload.processType = TmaProcessTypeEnum.SWITCH_SERVICE_PROVIDER;
        serviceProviderPayload.serviceProviderName = this.serviceProvider
      } else {
        serviceProviderPayload.processType = TmaProcessTypeEnum.ACQUISITION;
      }
      this.updateProvider.emit(serviceProviderPayload);
    } else {
      this.store.dispatch(new TmaChecklistActionAction.ChecklistActionDetails([{
        type: TmaChecklistActionType.CONTRACT_START_DATE,
        value: contractDate
      }]));
      if (this.selectedReasonPurchase === SWITCH_PROVIDER && this.serviceProvider) {
        this.store.dispatch(new TmaChecklistActionAction.ChecklistActionDetails([{
          type: TmaChecklistActionType.SERVICE_PROVIDER,
          value: this.serviceProvider
        }]));
      } else {
        this.store.dispatch(new TmaChecklistActionAction.ChecklistActionDetails([{
          type: TmaChecklistActionType.SERVICE_PROVIDER,
          action: TmaActionType.REMOVE
        }]));
      }
    }
    this.updateContractStartDate.emit(contractDate);
  }

  getSelectedReasonPurchase(): string {
    if (this.processType !== undefined) {
      this.selectedReasonPurchase = this.processType.id === TmaProcessTypeEnum.SWITCH_SERVICE_PROVIDER ? SWITCH_PROVIDER : MOVE;
    }
    return this.selectedReasonPurchase;
  }

  get constants(): TmaConstantResourceModel {
    return LOCAL_STORAGE;
  }

}
