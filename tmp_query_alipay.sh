#!/bin/bash
set -e
su - postgres -c "psql -d orion_key -At <<'SQL'
select id, channel_code, provider_type, config_data from payment_channels where channel_code='alipay';
SQL"
