with open('src/lib/agent/domain-parameter-discovery.ts', 'r') as f:
    content = f.read()

# Verify keywords are in DOMAIN_PROFILES
if 'hrnek' in content and 'household_drinkware' in content:
    print('✅ household_drinkware profile correctly integrated in DOMAIN_PROFILES')
else:
    print('❌ Missing household_drinkware profile')
