'use strict';

module.exports = {
  dependency: {
    platforms: {
      // ios: the podspec at the package root is discovered automatically.
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.testfairy.react.TestFairyPackage;',
        packageInstance: 'new TestFairyPackage()',
      },
    },
  },
};
