#!/bin/bash

# ABN Lookup GUID Setup Script
# Run this when you receive your GUID from ABR

echo "🎯 ABN Lookup GUID Setup"
echo "========================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    touch .env
fi

echo "When you receive your GUID email from ABR, it will look like:"
echo "GUID: 12345678-1234-1234-1234-123456789012"
echo ""

read -p "Enter your ABN Lookup GUID (or press Enter to skip): " guid

if [ -n "$guid" ]; then
    # Remove any existing ABN_LOOKUP_GUID line
    grep -v "ABN_LOOKUP_GUID=" .env > .env.tmp && mv .env.tmp .env
    
    # Add the new GUID
    echo "ABN_LOOKUP_GUID=$guid" >> .env
    
    echo "✅ GUID configured successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Restart your API server: npm run dev (in apps/api)"
    echo "2. Test company lookup on any holder detail page"
    echo "3. Look for 'Public Data Available' indicators"
    echo ""
    echo "🧪 Test the API directly:"
    echo "curl \"http://localhost:4000/api/company-lookup/abn-search?name=BHP\""
    echo ""
else
    echo "⏳ No GUID entered. Run this script again when you receive your GUID."
    echo ""
    echo "📧 Check your email for ABR approval (usually 1-2 business days)"
    echo "📝 Registration status: https://abr.business.gov.au/Tools/WebServices"
fi

echo ""
echo "📋 Current .env configuration:"
if grep -q "ABN_LOOKUP_GUID" .env; then
    echo "✅ ABN_LOOKUP_GUID is configured"
else
    echo "⏳ ABN_LOOKUP_GUID not yet configured"
fi

echo ""
echo "🔗 Useful links:"
echo "• ABR Web Services: https://abr.business.gov.au/Tools/WebServices"
echo "• Documentation: https://abr.business.gov.au/Documentation/Default"
echo "• Test your GUID: https://abr.business.gov.au/json/"
