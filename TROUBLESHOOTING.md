# Email Sending Troubleshooting

## Issue Fixed
Added error handling so emails can be sent even if Oracle SIS connection fails.

## How to Test
1. Run: `/local/earlyalert/test_oracle_connection.php`
2. Check error logs after sending emails
3. Look for "Early Alert -" messages in logs

## Common Solutions
- Check config.php has yorktasks_sisuser, yorktasks_sispass, yorktasks_sisconnstring
- Verify OCI8 extension loaded: `php -m | grep oci`
- Test Oracle view exists: V222.VIEW_MOODLE_EARLY_ALERTS
- Check Docker container can reach Oracle server

## Files Changed
- classes/external/record_log_ws.php (added try-catch)
- classes/oracle_client.php (better errors)
- test_oracle_connection.php (new diagnostic tool)
