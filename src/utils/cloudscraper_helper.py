#!/usr/bin/env python3
"""
Cloudscraper helper script for bypassing Cloudflare protection.
This script is called by the Node.js server to make HTTP requests to protected sites.
"""

import sys
import json
import cloudscraper

def main():
    """Read request from stdin, make request, write response to stdout."""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())

        url = input_data.get('url')
        method = input_data.get('method', 'GET').upper()
        headers = input_data.get('headers', {})
        params = input_data.get('params', {})
        data = input_data.get('data')
        timeout = input_data.get('timeout', 30)

        if not url:
            raise ValueError("URL is required")

        # Create cloudscraper session
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'desktop': True
            }
        )

        # Make request based on method
        if method == 'GET':
            response = scraper.get(url, headers=headers, params=params, timeout=timeout)
        elif method == 'POST':
            response = scraper.post(url, headers=headers, params=params, json=data, timeout=timeout)
        else:
            raise ValueError(f"Unsupported method: {method}")

        # Build response object
        result = {
            'status': response.status_code,
            'ok': response.ok,
            'headers': dict(response.headers),
            'url': response.url,
        }

        # Try to parse as JSON, otherwise return text
        try:
            result['data'] = response.json()
            result['isJson'] = True
        except (json.JSONDecodeError, ValueError):
            result['data'] = response.text
            result['isJson'] = False

        # Output JSON response
        print(json.dumps(result))

    except Exception as e:
        # Output error as JSON
        error_result = {
            'error': True,
            'message': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
