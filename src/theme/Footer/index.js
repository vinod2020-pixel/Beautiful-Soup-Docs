import React from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import FooterCopyright from '@theme/Footer/Copyright';
import FooterLayout from '@theme/Footer/Layout';
function Footer() {
  const {footer} = useThemeConfig();
  if (!footer) {
    return null;
  }
  const {copyright, style} = footer;
  return (
    <FooterLayout
      style={style}
      copyright={copyright && <FooterCopyright copyright={copyright} />}
    />
  );
}
export default React.memo(Footer);
