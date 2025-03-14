"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let TransactionsService = class TransactionsService {
    constructor() {
        this.googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeKqhBGX1mG-oLmcaD7dhKqWwNyOU8K0Te0yhCB6baHPazaUw/formResponse';
    }
    async submitToGoogleForm(data) {
        try {
            console.log('Input data:', data);
            const [year, month, day] = data['Date'] ? data['Date'].split('-') : ['', '', '']; // Разбиваем дату, если она есть
            const formData = {};
            // Заполняем formData только теми полями, которые есть в `data`
            const fieldMapping = {
                'Request ID': 'entry.2089687843',
                'CustomerId': 'entry.87686495',
                'CBU': 'entry.778788129',
                'Coelsa ID': 'entry.168660517',
                'Name': 'entry.537829146',
                'Amount': 'entry.1117234379',
                'CUIT': 'entry.2094946368',
                'Receipt': 'entry.1909419695',
            };
            Object.entries(fieldMapping).forEach(([key, entryId]) => {
                if (data[key]) {
                    formData[entryId] = data[key];
                }
            });
            // Добавляем дату, если она есть
            if (year)
                formData['entry.1640211570_year'] = year;
            if (month)
                formData['entry.1640211570_month'] = month;
            if (day)
                formData['entry.1640211570_day'] = day;
            console.log('Form data to send:', Object.fromEntries(new URLSearchParams(formData)));
            const response = await axios_1.default.post(this.googleFormUrl, new URLSearchParams(formData), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            console.log('Google Form response:', {
                status: response.status,
                statusText: response.statusText,
            });
            return {
                success: true,
                status: response.status,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error submitting to Google Form:', errorMessage);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to submit to Google Form',
                error: errorMessage,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)()
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map