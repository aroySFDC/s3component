import { LightningElement, api, wire, track } from 'lwc';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi'
import getQuoteLines from '@salesforce/apex/S3BundleController.getS3QuoteLine';
import ProductSelectorModal from 'c/productRegionSelector'
import QUOTE_FIELD from '@salesforce/schema/QuoteLineItem.QuoteId'
import { refreshApex } from '@salesforce/apex'

const cols = [
    {label : 'Product', fieldName : 'Product', editable : false},
    {label : 'Region', fieldName : 'Region__c', editable : false},
    {label : 'Rate', fieldName : 'Rate__c', editable : false},
    {label : 'Desired Rate', fieldName : 'Desired_Rate__c', editable : true}
]
export default class S3Component extends LightningElement {
    @api recordId
    quoteId
    _wiredQuoteLineItemsResult
    @track quoteLineItems = []
    columns = cols
    isLoading = false

    async openModal () {
        await ProductSelectorModal.open({ 
            size: 'large',
            recordId: this.recordId 
        });
       this.handleModalClosed()
    }

    @wire(getRecord, {
        recordId : '$recordId', 
        fields : [QUOTE_FIELD]
    })
    getS3LineItem (data, error) {
        this.quoteId = getFieldValue(data.data, QUOTE_FIELD)
    }
    @wire(getQuoteLines, {quoteId : '$quoteId'})
    wiredQuoteLineItems (wireResult) {
        const { data, error } = wireResult;
        this._wiredQuoteLineItemsResult = wireResult
        if(data) {
            this.quoteLineItems = data.map(item => ({
                ...item, "Product" : item.Product2?.Name
            }))
        } else {
            // handle error
        }
    }

    async handleModalClosed() {
        this.isLoading = true
        try {
            await refreshApex(this._wiredQuoteLineItemsResult)
        } catch (error) {
            console.error('Error refreshing data : ', error)
        } finally {
            this.isLoading = false
        }
    }

    
}