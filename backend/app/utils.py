"""Utility functions for URL validation and normalization"""

from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from typing import Optional
from .config import settings
from .exceptions import ValidationException


def normalize_url(url: str) -> str:
    """
    Normalize a URL to prevent duplicate entries for the same resource.
    """
    if not url or not url.strip():
        raise ValidationException("URL cannot be empty")
    
    url = url.strip()
    
    try:
        parsed = urlparse(url)
        
        if not parsed.scheme or not parsed.netloc:
            raise ValidationException("Invalid URL: must include scheme and domain")
        
        # Normalize scheme and netloc to lowercase
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        
        # Remove default ports
        if scheme == 'http' and netloc.endswith(':80'):
            netloc = netloc[:-3]
        elif scheme == 'https' and netloc.endswith(':443'):
            netloc = netloc[:-4]
        
        # Normalize path (remove trailing slash unless it's the root)
        path = parsed.path
        if path and path != '/' and path.endswith('/'):
            path = path.rstrip('/')
        if not path:
            path = '/'
        
        # Sort query parameters alphabetically
        query = ''
        if parsed.query:
            params = parse_qs(parsed.query, keep_blank_values=True)
            sorted_params = sorted(params.items())
            query = urlencode(sorted_params, doseq=True)
        
        # Remove fragment (everything after #)
        # Reconstruct URL without fragment
        normalized = urlunparse((scheme, netloc, path, parsed.params, query, ''))
        
        return normalized
    
    except Exception as e:
        raise ValidationException(f"Invalid URL format: {str(e)}")


def validate_url(url: str) -> str:
    """
    Validate and sanitize a URL.
    """
    if not url or not url.strip():
        raise ValidationException("URL cannot be empty")
    
    url = url.strip()
    
    # Check length
    if len(url) > settings.max_url_length:
        raise ValidationException(
            f"URL too long: maximum {settings.max_url_length} characters"
        )
    
    # Check for null bytes or other dangerous characters
    if '\x00' in url:
        raise ValidationException("URL contains invalid characters")
    
    # Strip whitespace which may include newlines/carriage returns
    url = url.strip()
    
    # Parse and validate URL structure
    try:
        parsed = urlparse(url)
        
        # Must have scheme and netloc
        if not parsed.scheme:
            raise ValidationException("URL must include a scheme (e.g., http, https)")
        
        if not parsed.netloc:
            raise ValidationException("URL must include a domain")
        
        # Only allow http and https schemes
        if parsed.scheme.lower() not in ['http', 'https']:
            raise ValidationException("Only HTTP and HTTPS URLs are supported")
        
        # Normalize the URL
        normalized = normalize_url(url)
        
        return normalized
    
    except ValidationException:
        raise
    except Exception as e:
        raise ValidationException(f"Invalid URL format: {str(e)}")

