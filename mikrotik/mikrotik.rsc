# 2026-02-09 07:41:29 by RouterOS 7.21.2
# system id = KhHPIxWBGzE
#
/interface ethernet
set [ find default-name=ether1 ] disable-running-check=no
/ip dhcp-client
add interface=ether1
/snmp
set enabled=yes trap-version=2
