# Company Lookup Setup Guide

This guide explains how to set up real Australian company data sources for the Mining Hub.

## 🎯 Data Sources Implemented

### 1. ABN Lookup Web Services (Free - Recommended)
**What you get:** ABN, company name, status, entity type, GST status, registered address
**Cost:** Free (with registration)
**Setup:**
1. Register at: https://abr.business.gov.au/Tools/WebServices
2. Get your GUID (takes 1-2 business days)
3. Add to your environment: `ABN_LOOKUP_GUID=your-guid-here`

### 2. ASIC Data via data.gov.au (Free)
**What you get:** Company registration, status, address, some corporate details
**Cost:** Free
**Setup:** No registration required, but data may be delayed/incomplete

### 3. OpenCorporates (Freemium)
**What you get:** International company data including Australia
**Cost:** Free tier available, paid for more features
**Setup:**
1. Register at: https://opencorporates.com/api_accounts/new
2. Get API key
3. Add to environment: `OPENCORPORATES_API_KEY=your-key-here`

## 🚀 Quick Start (Using Mock Data)

The system works immediately with mock data for these companies:
- RADIANT MINERALS PTY LTD
- RADIANT EXPLORATION PTY LTD  
- CENTRAL PILBARA NORTH IRON ORE PTY LTD

## 📋 Production Setup Steps

### Step 1: ABN Lookup (Recommended)
```bash
# 1. Register at ABR website
# 2. Wait for GUID approval (1-2 days)
# 3. Add to your .env file:
echo "ABN_LOOKUP_GUID=your-actual-guid" >> .env
```

### Step 2: OpenCorporates (Optional)
```bash
# 1. Register at OpenCorporates
# 2. Get API key
# 3. Add to your .env file:
echo "OPENCORPORATES_API_KEY=your-api-key" >> .env
```

### Step 3: Test the Setup
```bash
# Test ABN lookup
curl "http://localhost:4000/api/company-lookup/abn-search?name=BHP"

# Test ASIC data
curl "http://localhost:4000/api/company-lookup/asic-search?name=BHP"
```

## 🔧 API Endpoints

### Search by Company Name
```
GET /api/company-lookup/abn-search?name={company_name}
```

### Get Details by ABN
```
GET /api/company-lookup/abn-details?abn={abn_number}
```

### Search ASIC Data
```
GET /api/company-lookup/asic-search?name={company_name}
```

## 📊 Data Quality Notes

1. **ABN Lookup**: Most reliable for basic company info
2. **ASIC data.gov.au**: May have delays, good for bulk data
3. **OpenCorporates**: Good international coverage, variable quality
4. **Mock Data**: Immediate testing, limited to predefined companies

## 🔒 Rate Limits & Best Practices

- **ABN Lookup**: Reasonable use policy (no specific limits published)
- **ASIC data.gov.au**: No published limits
- **OpenCorporates**: Free tier has limits, check their pricing

## 🐛 Troubleshooting

### "ABN_LOOKUP_GUID not configured"
- Register at ABR website and wait for approval
- Add GUID to environment variables

### "No company data found"
- Check company name spelling
- Try variations (with/without PTY LTD, etc.)
- Company may not be registered or active

### API timeouts
- Check internet connection
- Government APIs can be slow during business hours
- Implement retry logic for production use
