TestFairyBridge
===============
[TestFairy](https://www.testfairy.com) bridge to the TestFairy iOS SDK. Integrating the TestFairy SDK into your app allows better understanding of how your app performs on real devices. It tells you when and how people are using your app, and provide you with any metric you need to optimize for better user experience and better code.

## Manual installation iOS

1. `npm install --save react-native-testfairy`
2. In XCode, right click the Libraries folder under your project ➜ `Add Files to <your project>`.
3. Go to `node_modules` ➜ `react-native-testfairy` ➜ `ios` and add all files.
4. Add libTestFairy.a from the linked project to your project properties ➜ "Build Phases" ➜ "Link Binary With Libraries"
5. Next you will have to link a few more SDK framework/libraries which are required by TestFairy (if you do not already have them linked.) Under the same "Link Binary With Libraries", click the + and add the following:  
   * CoreMedia.framework  
   * CoreMotion.framework  
   * AVFoundation.framework  
   * SystemConfiguration.framework  
   * OpenGLES.framework  

## Manual installation Android

```gradle
// file: android/settings.gradle
...

include ':react-native-testfairy'
project(':react-native-testfairy').projectDir = new File(settingsDir, '../node_modules/react-native-testfairy/android')
```
```gradle
// file: android/app/build.gradle
...

dependencies {
    ...
    compile project(path: ':react-native-testfairy')
}
```

```java
// file: MainActivity.java
...

import com.testfairy.react.TestFairyPackage; // import package

public class MainActivity extends ReactActivity {

   /**
   * A list of packages used by the app. If the app uses additional views
   * or modules besides the default ones, add more packages here.
   */
    @Override
    protected List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new TestFairyPackage() // Add package
        );
    }
...
}

```

## Usage
Once the native library has been added to your project, you can now enable session recording with TestFairy. You will need an app token, which you can get from your [preferences](http://app.testfairy.com/settings/) page on your TestFairy account.

Next, from your JavaScript file, (index.ios.js for example), import the TestFairy bridge into your project, and invoke `begin` passing in the app token. Best time to invoke `begin` is usually in `componentWillMount` or right before you register your application. 

```
const TestFairy = require('react-native-testfairy');
...
componentWillMount: function() {
  TestFairy.begin('<insert ios app token here>');
}
```

And that's it! You can now log into your [account](http://app.testfairy.com) and view your sessions. Also, feel free to refer to the [documentation](https://github.com/testfairy/react-native-testfairy/blob/master/index.js) for other available APIs.

### Hiding views
TestFairy allows the developer to hide specific views from the recorded video. As the developer, you may choose to hide one or more views from video for security and privacy reasons. For example, you might want to remove all information related to credit card data from appearing in the session.

In order to hide views from your recorded session, you will need to pass a reference to a view to TestFairy. First, give the element to be hidden a `ref` attribute. For example:

```
<Text ref="instructions">This will be hidden</Text>
```

Next, in a component callback, such as `componentDidMount`, pass the reference ID back to TestFairy by invoking `hideView`. 

```
const TestFairy = require('react-native-testfairy');
...
var MyComponent = React.createClass({
  ...
  componentWillMount: function() {
    TestFairy.begin('<insert ios app token here>');
  },

  componentDidMount: function() {
    TestFairyBridge.hideView(this.refs.instructions);
  },
  ...
  render: function() {
    return (<Text ref="instructions">This will be hidden</Text>);
  }
});
```

Now, your Views will be hidden before any video is uploaded to TestFairy.

## Migrating from 1.x to 2.x
In order to migrate from 1.x to 2.x, a minor change is required in the way you hide views.

Remove the import of `findNodeHandle`
```
- var { findNodeHandle } = React;
```

Pass the `ref` object directly into `TestFairy.hideView()`
```
- TestFairyBridge.hideView(findNodeHandle(this.refs.instructions));
+ TestFairyBridge.hideView(this.refs.instructions);
```

License
=======

    Copyright 2016 TestFairy.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
