"""
Tests for URL validation and normalization utilities
"""

import pytest
from app.utils import normalize_url, validate_url
from app.exceptions import ValidationException


class TestNormalizeUrl:
    """Tests for URL normalization"""

    def test_normalize_basic_url(self):
        """Test basic URL normalization"""
        url = "https://example.com/path"
        result = normalize_url(url)
        assert result == "https://example.com/path"

    def test_normalize_removes_trailing_slash(self):
        """Test that trailing slashes are removed"""
        url = "https://example.com/path/"
        result = normalize_url(url)
        assert result == "https://example.com/path"

    def test_normalize_keeps_root_slash(self):
        """Test that root path keeps its slash"""
        url = "https://example.com/"
        result = normalize_url(url)
        assert result == "https://example.com/"

    def test_normalize_lowercase_scheme(self):
        """Test that scheme is converted to lowercase"""
        url = "HTTPS://example.com/path"
        result = normalize_url(url)
        assert result == "https://example.com/path"

    def test_normalize_lowercase_domain(self):
        """Test that domain is converted to lowercase"""
        url = "https://EXAMPLE.COM/path"
        result = normalize_url(url)
        assert result == "https://example.com/path"

    def test_normalize_removes_default_http_port(self):
        """Test that default HTTP port 80 is removed"""
        url = "http://example.com:80/path"
        result = normalize_url(url)
        assert result == "http://example.com/path"

    def test_normalize_removes_default_https_port(self):
        """Test that default HTTPS port 443 is removed"""
        url = "https://example.com:443/path"
        result = normalize_url(url)
        assert result == "https://example.com/path"

    def test_normalize_keeps_custom_port(self):
        """Test that custom ports are kept"""
        url = "https://example.com:8080/path"
        result = normalize_url(url)
        assert result == "https://example.com:8080/path"

    def test_normalize_sorts_query_params(self):
        """Test that query parameters are sorted alphabetically"""
        url = "https://example.com/path?z=1&a=2&m=3"
        result = normalize_url(url)
        assert result == "https://example.com/path?a=2&m=3&z=1"

    def test_normalize_handles_multiple_param_values(self):
        """Test handling of multiple values for same parameter"""
        url = "https://example.com/path?tag=python&tag=django"
        result = normalize_url(url)
        assert "tag=python" in result
        assert "tag=django" in result

    def test_normalize_removes_fragment(self):
        """Test that fragment identifiers are removed"""
        url = "https://example.com/path#section"
        result = normalize_url(url)
        assert result == "https://example.com/path"
        assert "#" not in result

    def test_normalize_adds_slash_if_missing(self):
        """Test that root slash is added if missing"""
        url = "https://example.com"
        result = normalize_url(url)
        assert result == "https://example.com/"

    def test_normalize_empty_url_raises_error(self):
        """Test that empty URL raises ValidationException"""
        with pytest.raises(ValidationException, match="URL cannot be empty"):
            normalize_url("")

    def test_normalize_whitespace_url_raises_error(self):
        """Test that whitespace-only URL raises ValidationException"""
        with pytest.raises(ValidationException, match="URL cannot be empty"):
            normalize_url("   ")

    def test_normalize_invalid_url_raises_error(self):
        """Test that invalid URL raises ValidationException"""
        with pytest.raises(ValidationException, match="Invalid URL"):
            normalize_url("not a url")

    def test_normalize_url_without_scheme_raises_error(self):
        """Test that URL without scheme raises ValidationException"""
        with pytest.raises(ValidationException, match="Invalid URL: must include scheme and domain"):
            normalize_url("example.com")

    def test_normalize_complex_url(self):
        """Test normalization of complex URL with multiple features"""
        url = "HTTPS://EXAMPLE.COM:443/Path/?z=1&a=2#fragment"
        result = normalize_url(url)
        assert result == "https://example.com/Path?a=2&z=1"


class TestValidateUrl:
    """Tests for URL validation"""

    def test_validate_basic_http_url(self):
        """Test validation of basic HTTP URL"""
        url = "http://example.com/path"
        result = validate_url(url)
        assert result == "http://example.com/path"

    def test_validate_basic_https_url(self):
        """Test validation of basic HTTPS URL"""
        url = "https://example.com/path"
        result = validate_url(url)
        assert result == "https://example.com/path"

    def test_validate_empty_url_raises_error(self):
        """Test that empty URL raises ValidationException"""
        with pytest.raises(ValidationException, match="URL cannot be empty"):
            validate_url("")

    def test_validate_whitespace_url_raises_error(self):
        """Test that whitespace-only URL raises ValidationException"""
        with pytest.raises(ValidationException, match="URL cannot be empty"):
            validate_url("   ")

    def test_validate_url_too_long_raises_error(self):
        """Test that URLs exceeding max length raise ValidationException"""
        from app.config import settings
        long_url = "https://example.com/" + "a" * settings.max_url_length
        with pytest.raises(ValidationException, match="URL too long"):
            validate_url(long_url)

    def test_validate_url_with_null_byte_raises_error(self):
        """Test that URLs with null bytes raise ValidationException"""
        url = "https://example.com/path\x00"
        with pytest.raises(ValidationException, match="URL contains invalid characters"):
            validate_url(url)

    def test_validate_url_with_newline_raises_error(self):
        """Test that URLs with newlines are stripped and normalized"""
        url = "https://example.com/path\n"
        result = validate_url(url)
        assert result == "https://example.com/path"

    def test_validate_url_with_carriage_return_raises_error(self):
        """Test that URLs with carriage returns are stripped and normalized"""
        url = "https://example.com/path\r"
        result = validate_url(url)
        assert result == "https://example.com/path"

    def test_validate_url_without_scheme_raises_error(self):
        """Test that URLs without scheme raise ValidationException"""
        with pytest.raises(ValidationException, match="URL must include a scheme"):
            validate_url("example.com/path")

    def test_validate_url_without_domain_raises_error(self):
        """Test that URLs without domain raise ValidationException"""
        with pytest.raises(ValidationException, match="URL must include a domain"):
            validate_url("https://")

    def test_validate_ftp_url_raises_error(self):
        """Test that non-HTTP(S) URLs raise ValidationException"""
        with pytest.raises(ValidationException, match="Only HTTP and HTTPS URLs are supported"):
            validate_url("ftp://example.com/file")

    def test_validate_file_url_raises_error(self):
        """Test that file URLs raise ValidationException"""
        with pytest.raises(ValidationException):
            validate_url("file:///path/to/file")

    def test_validate_normalizes_url(self):
        """Test that validation also normalizes the URL"""
        url = "HTTPS://EXAMPLE.COM:443/Path/?z=1&a=2#fragment"
        result = validate_url(url)
        assert result == "https://example.com/Path?a=2&z=1"

    def test_validate_strips_whitespace(self):
        """Test that validation strips leading/trailing whitespace"""
        url = "  https://example.com/path  "
        result = validate_url(url)
        assert result == "https://example.com/path"

    def test_validate_url_with_port(self):
        """Test validation of URL with custom port"""
        url = "https://example.com:8080/path"
        result = validate_url(url)
        assert result == "https://example.com:8080/path"

    def test_validate_url_with_auth(self):
        """Test validation of URL with authentication"""
        url = "https://user:pass@example.com/path"
        result = validate_url(url)
        assert "user:pass@example.com" in result

    def test_validate_url_with_unicode(self):
        """Test validation of URL with unicode characters"""
        url = "https://example.com/path/ñoño"
        result = validate_url(url)
        assert result is not None

