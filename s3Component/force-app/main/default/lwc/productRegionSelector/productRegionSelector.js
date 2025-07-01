import { LightningElement, track, wire, api } from 'lwc';
import getProducts from "@salesforce/apex/S3BundleController.getS3Products";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue, createRecord } from 'lightning/uiRecordApi'
import QUOTELINEITEM_OBJECT from '@salesforce/schema/QuoteLineItem'
import QUOTE_FIELD from '@salesforce/schema/QuoteLineItem.QuoteId'
import LightningModal from 'lightning/modal'

export default class ProductRegionSelector extends LightningModal {

    selectedRegions = [];
    selectedProducts = [];
    selectedProductpills = []
    @track quoteLineItems = [];
    @api recordId
    quoteId
    s3Products = []
    saveInProgress = false
    
    get activeSections () {
        return ["A", "B", "C"]
    
    }

    columns = [
        {label : "Region", fieldName : "Region", type : "text", editable : false},
        {label : "Sub-Service", fieldName : "Product", type : "picklist", editable : false},
        {label : "Pre-Approved rate($/GB)", fieldName : "Rate__c", type : "currency", editable : false},
        {label : "Desired Rate", fieldName : "Desired_Rate__c", type : "currency", editable : true}
    ]

    @wire(getRecord, {recordId : '$recordId', fields : [QUOTE_FIELD]})
    quotelineS3 ({data}) {
        this.quoteId = getFieldValue(data, QUOTE_FIELD)
    }



    get products() {
        if(this.s3Products) {
            return this.s3Products.map(entry => {
                return {
                    "label" : entry.Product2.Name,
                    "value" : entry.Product2.Id
                }
            })
        }
    }

    get regions() {
        return [
            {label : 'US East (North Virginia)', value : 'US East (Virginia)'},
            {label : 'US East (Ohio)', value : 'US East (Ohio)'},
            {label : 'US West (N. California)', value : 'US West (California)'},
            {label : 'US West (Oregon)', value : 'US West (Oregon)'},
            {label : 'Canada (Central)', value : 'Canada (Central)'},
            {label : 'EU (Ireland)', value : 'EU (Ireland)'},
            {label : 'EU (Frankfurt)', value : 'EU (Frankfurt)'},
            {label : 'EU (London)', value : 'EU (London)'},
        ]    
    }


    @wire(getProducts)
    wiredProducts(result, error) {
        console.log('inside wiredProducts function')
        if(result) {
            this.s3Products = result.data
            console.log(this.s3Products)
        }
    }

    handleProductSelection(event) {
        console.log(event)
        
        if(!this.selectedProducts.includes(event.detail.value)) {
            this.selectedProducts.push(event.detail.value)
            const selectedProductOption = this.products.find(product => product.value == event.detail.value)
            console.log(selectedProductOption.label)
            this.selectedProductpills.push(selectedProductOption.label)
        }
    }

    handleRegionSelection(event) {
        this.quoteLineItems = []
        if(!this.selectedRegions.includes(event.detail.value)){
            this.selectedRegions.push(event.detail.value);
        }

        if(this.selectedProducts.length > 0 && this.selectedRegions.length > 0) {
            this.selectedProducts.forEach(product => {
                const s3Product = this.s3Products?.find(item => item.Product2.Id == product)
                this.quoteLineItems = this.quoteLineItems.concat(this.getQuoteLineItemsByRegion(s3Product.Product2.Name, this.selectedRegions))
            })
        }

    }

    getQuoteLineItemsByRegion(product, regions) {
        return regions.map(region => {
            return {
                "key" : product + "-" + region,
                "Region" : region,
                "Product" : product,
                "Rate__c" : "0",
                "Desired_Rate__c" : "0"
            }
        })
    }

    handleRemovalRegion (event) {
        this.selectedRegions = this.selectedRegions.filter(item => item !== event.detail.name)
        this.quoteLineItems = this.quoteLineItems.filter(item => item.Region != event.detail.name)
    }

    handleRemovalProduct (event) {
        this.selectedProductpills = this.selectedProductpills.filter(item => item !== event.detail.name)
        this.quoteLineItems = this.quoteLineItems.filter(item => item.Product !== event.detail.name)
    }

    handleSave() {
        console.log('inside save function')
        console.log(this.quoteLineItems)
        if(this.quoteLineItems) {
            
            const quoteLineInputs = this.quoteLineItems.map(item => {
                const s3Product = this.s3Products.find(product => product.Product2.Name == item.Product)
                return {
                    "QuoteId" : this.quoteId,
                    "Product2Id" : s3Product.Product2Id,
                    "Rate__c" : item.Rate__c,   
                    "Region__c" : item.Region,
                    "Desired_Rate__c" : item.Desired_Rate__c,
                    "Quantity" : "1",
                    "UnitPrice": 0,
                    "PricebookEntryId" : s3Product.Id
                }
            })
            const promises = quoteLineInputs.map(item => {
                console.log(item.PricebookEntryId)
                return createRecord({apiName : QUOTELINEITEM_OBJECT.objectApiName, fields : item})
            })

            Promise.all(promises).then(() => {
                
                this.dispatchEvent(
                    new ShowToastEvent({    
                        title: 'Success',
                        message: 'Quote Line Items Updated Successfully',
                        variant: 'success'
                    })
                )   
                this.close('closed')
            }).catch(error => {
                console.log(error)
                this.dispatchEvent(
                    new ShowToastEvent({    
                        title: 'Error',
                        message: error.message,
                        variant: 'error'
                    })
                )   
            })
        }
    }

    handleClose() {
        this.close('closed')
    }

}