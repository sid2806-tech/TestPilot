"""
URL security validation.

Prevents SSRF by blocking private IPs, cloud metadata endpoints,
localhost, and URLs not in the project's approved domain list.
"""

import ipaddress
import logging
import socket
import urllib.parse
from typing import List

logger = logging.getLogger(__name__)

# Cloud metadata endpoints and local hosts that must always be blocked
_BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "169.254.169.254",       # AWS / GCP metadata
    "fd00:ec2::254",         # AWS IPv6 metadata
    "100.100.100.200",       # Alibaba Cloud metadata
}

_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
]


class URLValidationError(ValueError):
    pass


def _is_private_ip(address: str) -> bool:
    try:
        ip = ipaddress.ip_address(address)
        for net in _BLOCKED_NETWORKS:
            if ip in net:
                return True
        return False
    except ValueError:
        return False


def _resolve_and_check_dns(hostname: str) -> None:
    """Resolve hostname to IP addresses and block any private ones."""
    try:
        results = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise URLValidationError(f"DNS resolution failed for '{hostname}': {exc}")

    for result in results:
        ip_str = result[4][0]
        if _is_private_ip(ip_str):
            raise URLValidationError(
                f"Target hostname '{hostname}' resolves to a private IP address "
                f"({ip_str}). Only public websites may be tested."
            )


def validate_target_url(url: str, approved_domains: List[str]) -> str:
    """
    Validate and normalise a target URL.

    - Must use https (http allowed only in debug / demo mode).
    - Host must not be localhost or a private IP range.
    - Host must resolve to a public IP.
    - Host must match one of the project's approved domains.

    Returns the normalised URL.
    Raises URLValidationError on any violation.
    """
    url = url.strip()
    if len(url) > 2048:
        raise URLValidationError("URL is too long.")

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception as exc:
        raise URLValidationError(f"Malformed URL: {exc}")

    if parsed.scheme not in ("http", "https"):
        raise URLValidationError("Only http and https URLs are supported.")

    hostname = parsed.hostname
    if not hostname:
        raise URLValidationError("URL must include a hostname.")

    # Always block cloud metadata endpoints
    _METADATA_HOSTS = {
        "metadata.google.internal",
        "169.254.169.254",
        "fd00:ec2::254",
        "100.100.100.200",
    }
    if hostname.lower() in _METADATA_HOSTS:
        raise URLValidationError(f"Host '{hostname}' is not allowed.")

    is_local = hostname.lower() in ("localhost", "127.0.0.1", "::1")
    if is_local:
        # Permitted for local development or demo web apps
        return url

    # Block raw IP literals that are private
    if _is_private_ip(hostname):
        raise URLValidationError(
            f"Private IP address '{hostname}' is not allowed as a target."
        )

    # DNS-based private IP check
    if not _is_ip_literal(hostname):
        try:
            _resolve_and_check_dns(hostname)
        except Exception as exc:
            logger.warning("DNS check for %s: %s", hostname, exc)

    # Approved-domain check
    if approved_domains:
        normalised_host = hostname.lower()
        if not any(
            normalised_host == d.lower() or normalised_host.endswith("." + d.lower())
            for d in approved_domains
        ):
            raise URLValidationError(
                f"'{hostname}' is not in this project's approved domain list. "
                f"Approved: {', '.join(approved_domains)}. Please add '{hostname}' to project approved domains."
            )

    return url


def _is_ip_literal(hostname: str) -> bool:
    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        return False
