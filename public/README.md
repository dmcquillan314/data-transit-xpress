## Component documentation
located in the docs subdirectory

## Project Layout
- - -

Overall visual layout

- dist _compiles resource directory_
  - css _compiled css_
  - js _compiled js_
- node\_modules _node dependency files_
- site
  - fonts _font files_
  - images _image files_
  - pages _pages with includes to handle responsiveness_
  - partials _partial templates for various features_
    - desktop _desktop templates_
    - tablet _tablet templates_
    - mobile _mobile templates_
  - templates _templates to be used with directives_
- src
  - main
    - js
      - app
      - lib
    - scss
      - base
      - components
  - test
    - js
      - jasmine

The project layout for partial html files is designed such that the mobile, tablet and desktop files are in separate places since they are mostly different from each other.  Any common templates between the three should be defined as either a directive or a common include.  The partials are located in **site/partials** in the root of the project.

The files for the uncompiled resources (js, scss) are located in the **src/main** folder under the corresponding directory.  Within this directory they are broken up by component under each respective directory.

All Jasmine Specs should be placed in the **src/test/js** directory and divided up by component.


## Relevant Angular Documentation
- - -

## Authentication
- - -

### Login

The login module contains all components relevant to the login processes and error flows.

####Config:

    `/login/:loginType? -> [ template: 'pages/login/login.html', controller: 'LoginController' ]`

####Controllers:

**LoginController:**

Scope Variables

> `loginStep` - used in the switch block within the template to determine which content the fragment should display

> `hiddenPassword` - used to switch between masking the password and showing the password in the login form

> `guestUser` - object used to store the properties for the guest user form

> `user` - object used to store the properties for the user form

Scope Methods

> `getCssClasses ( ngModelController: FormFieldController )` - used to add/remove error state classes from the form elements within all login forms

> `showError ( ngModelController: FormFieldController, error: String )` - used to get an error message for a specified FormFieldController

> `sendGuestUser ( guestUser: GuestUserObject, guestUserForm: GuestUserFormObject )` - used to post the guest user object to the Peapod rest services

> `submitGuestUser ( $event: Event, guestUserForm: GuestUserFormObject )` - method to handle the callback from the form if the user hits enter or 'go' on a mobile device.  This method calls `sendGuestUser` as a delegate

> `sendUser ( user: UserObject, userForm: UserFormObject )` - used to post the user object to the Peapod rest services

> `submitUser ( $event: Event, userForm: UserFormObject )` - method to handle the callback from the form if the user hits enter or 'go' on a mobile device. This method calls `sendUser` as a delegate.


####Services

**LoginControllerService**

> `handleGuestError ( guestUser: GuestUserObject, guestUserForm: GuestUserFormObject, response: Response )` - this method reads the response from the Peapod rest api and then sends the guest user to the correct error result page within the guest login sequence

> `handleGuestSuccess ( response: Response )` - this method reads the response from the Peapod rest api and then sends the guest user to the authenticated user home page ( `index.jhtml#/home` ).  This method also handles the case where a user that we don't service submits their email to our rest api successfully.

> `handleUserSuccess (user: UserObject, response: Response )` - this method checks the result code from the Peapod rest api to check if they logged in successfully and then forwards them to the authenticated user home page ( `index.jhtml#/home` ).

> `handleUserError ( user: UserObject, userForm: UserFormObject, response: Response ) errorResponse: Object` - this method handles all error cases from the login apis.  It will result an object representing the error message to be displayed to the user

> `injectGuestErrorPropsToUser ( user: UserObject )` - this method given a user object will inject the cities, zip, and customerType to the user object using the `SharedProperties` service with the keys **guestCities** and **guestUser** respectively

> `injectGuestErrorPropsToScope ( $scope: $Scope )` - this method given the current $scope object from the LoginController will add the cities object using the `SharedProperties` service with the key **guestCities** to be used with the select list of the ambiguous city selector

> `clearGuestProps` - this method clears the values for **guestCities** and **guestUser** in the `SharedProperties` service.  This method is called on destroy of the LoginController

####Example Flow

**Guest Login w/ Ambiguous City

1. User submits form with zip code -> `LoginController.user.zip = 60089`

2. Trigger event listen for key id 13 -> `submitUser($event, userForm)`

3. Calls `sendUser` from `submitUser`

4. Calls `sendGuestUser`

5. Response is returned from rest api which calls `handleGuestError`

6. Cities property is injected into the scope

7. User selects a city and then will repeat steps 2 - 4

8. Response is returned from rest api which calls `handleGuestSuccess`

9. User is logged in


### Logout

####Controllers

**LogoutController**

Scope Variables

> N/A

Scope Methods

> logoutUser - calls the `LogoutFactory.logout` method.  If response is successful then the user is logged out and is redirected to `login.jhtml#/login`

### Authentication Factory

#### Factories

**GuestLoginFactory**

This factory returns the following http resource:

> Method : 'POST'

> Params : { zip, customerType, cityId, email }

> Url : '/api/v2.0/user/guest'

**UserLoginFactory**

This factory returns the following http resource:

> Method : 'POST'

> Params : { loginName, password, rememberMe: true }

> Url : '/api/v2.0/user/login'

**LogoutFactory**

This factory returns the following http resource:

> Method : 'POST'

> Params : {}

> Url : '/api/v2.0/user/logout'


## Home
- - -

This module contains the routes specified for the home page of the application.  It also contains a mapping for a catch all route to automatically redirect the user to the home page if an invalid url is given.


#### Config:

    `[ /, /home ] -> [ template: 'pages/home/home.html', controller: 'HomeController' ]`

#### Controllers:

**HomeController**

This controller currently has no properties associated with it.  The content of this controller will be entered when needed.


## Http
- - -

This module contains all components relevent to the http request behavior and http pipeline of the application.

### Http Interceptors (Similar to a set of pipeline servlets)

#### Config

The configuration of this component simply registers the two interceptors below as follows:

`$httpProvider.responseInterceptors.push('SessionHttpInterceptor');`

`$httpProvider.responseInterceptors.push('AuthHttpInterceptor');`


#### Factories

**SessionHttpInterceptor**

This interceptor is a catch all for any http request that returns in error.  Upon receipt it will check the response for the following condition:

> Response status : 403 | 401

> Response Code : SESSION_INVALID

If this condition is met then it will rerequest the failed call at most one time.

This interceptor will always be called on first time start up of the application and will make a call to the **Session Id rest api** to create all the necessary cookies for server communication.

**AuthHttpInterceptor**

This interceptor has two purposes which are the following:

1. Check on app start up if the user is logged in using the **login status rest api** in the success block of the interceptor.

2. If an error occurs during an http request redirect the user to the non authenticated url if the following condition is met:

> Response status : 403 | 401

> Response Code : LOGIN_REQUIRED


## Keyed Routes
- - -

### Keyed Route

#### Services

**keyedRouteService**

Methods

> `getKeyedArray( params )` - This method takes in a url and transforms it into a javascript object.

Example

`keyedRouteService.getKeyedArray( '/categories/0/categories/1/categories/2/products/1')`

will return the following:

{
    categories: [0,1,2],
    products: [1]
}


#### Services


## Keypress
- - -

### ui.keypress

This set of directives was taken from the angular ui project.

#### Directives

The directives takes a hash (object) with the key code as the key and the callback function to fire as the value. The callback function takes an 'event' param

**uiKeydown**

Example:

```html
<textarea
        ui-keypress="{13:'keypressCallback($event)'}">
</textarea>
```

```html
<textarea
        ui-keydown="{'enter alt-space':'keypressCallback($event)'}">
</textarea>
```

**uiKeypress**

Example:

```html
<textarea
        ui-keypress="{13:'keypressCallback($event)'}">
</textarea>
```

**uiKeyup**

Example:

```html
<textarea
        ui-keyup="{'enter':'keypressCallback($event)'}">
</textarea>
```


## Loading
- - -

#### Directives

**ppdLoadingClick**

This directive is used to display loading animations in a button or elsewhere.  It will also add in necessary dom when specified within the given element.

Directive usage:

```html
<ANY ppd-loading-click="somemethod"
        [animation-target="selector"]
        [animation-class="'some-class"]
        [loading-style="'style-class-to-add'"]
        [disable-clicks="true|false"]
        [create-child-element="true|false"]
        [done-callback="expression"]
        [prevent-bubbling="true|false"]>
</ANY>
```

Option descriptions:

> `ppd-loading-click` option must contain a scope method callback for when this is clicked.  It should usually be a route change request.

> `animation-target` option must be given a valid selector (preferably an id) to send the animation classes to

> `animation-class` option lets you override the default class added to an element when loaded

> `loading-style` option lets you specify a class to be added to the loading element in order to specify a specific style

> `disable-clicks` option disables clicks on all other **ppdLoadingClick** directives

> `create-child-element` options adds a child element to the element specified of `<span class=\'loading-spinner\'></span>`

> `done-callback` callback to be triggered with expression in ppd-loading-click has completed

> `prevent-bubbling` option will enable|disable stopPropagation on returned click event

Examples:

Creating simple loading animation element:

```html
<a ppd-loading-click="go('/home')"></a>
```

Creating a loading animation element for a button:

```html
<a ppd-loading-click="go('/home')" create-child-element></a>
```

In the case where this triggers an in route request which does not trigger a url change you must broadcast the following event from the parent controller:

`scope.$broadcast( 'ppdLoadingActionFinish', {});`


## Nutrition
- - -

#### Directives

**ppdNutrition**

This is a very simple directive which given a nutritionObject it will send it to a template for rendering.

Usage:

`<ppd-nutrition nutrition-object="product.nutrition"></ppd-nutrition>`


### Product

#### Constants

Product = product

#### Controllers

**ProductItemDetailController**

Scope Variables:

> `product` - stores the product object to be displayed.  The currently viewed product will automatically be injected into here when a product object is inserted using `SharedProperty.setProperty( 'product', {} )`

> `rating` - holds the rating response for the given productId.  Currently this is just dummy input since this service has not yet been created.

Scope Methods:

> N/A

## Product View
- - -

### Dependencies

The dependencies for this module are 'ProductViewServices', 'ProductViewProviders', 'ngRoute', 'ProductListDirectives'.

These dependencies are just used to collect all the product view related factories for the various route configs using this
module.

### Config

Currently there are three routes configured for this module

The base config block for any features implemented using this module should be the following:

    $routeProvider
        .when( '/url', {
            reloadOnSearch: false,

            controller: 'ProductViewController',

            templateUrl: 'pages/product-view/product_view.html'
        })

An example of a route configuration is below which is the configuration for product search:

    /product-search/:keywords -> { resolve: { data: productSearchProvider.resolveData } }

The resolve block should strictly be used to provide the service that will resolve the data parameter.

### Available options for provider

    data = {
        config: {  // used to specify custom options for this provider
            isFullWidth: [true|false], // used to hide the sidebar if there are no product groups [optional]
            sidebarTemplate: {  // used to override the inner sidebar template in the product view
                mobile: '',
                tablet: '',
                desktop: ''
            },
            viewTemplate: { // used to override the inner main view template in the product view
                mobile: '',
                tablet: '',
                desktop: ''
            },
            headerText: { // used to set the text in the subheader of the product view
                mobile: '' // text for mobile,
                tablet: '' // text for tablet,
                desktop: '' // text for desktop
            },
            sortTypes: [
                    name: 'Alphabetical Ascending', // display name
                    value: 'name asc' // value for option
                ] // if the default sort types should be overridden it should be placed here in the specified format

        },
        productData: { // contains data relevant to the products and product groups
            productGroups: [] // contains product groups (e.g. list from product lists),
            pagination: {} // pagination object from response [optional],
            facets: {} // available facets for refinement of search results using refine button,
            products: [] // products array,
            selectedProductGroup: {} // should be an object representing the currently selected product group,
            isProductGroupSelect: [true|false] // used with the selected product group although is mainly for switching between the list of product groups and the list of products in mobile
            productGroupId: '' // used to extract the product group id from the product group,
            productGroupNameKey: '' // used to extract the product group name from the product group
        },
        functions: { // used to provide delegate functions to be called from the controller ( these should all return promises )
            updateResults: function(options) {
                        // code to return promise
                   },
            selectGroupPromise: function( productGroup ) {
                // code to select a product group and return a promise or redirect to page using $location provider
            }
        }
    }

#### Function descriptions

**Update Results**

Delegate method used to update the results of the current result set.

This method should call the original method that was used to get the promise on the initial page request but should be passed a set of options.  An example implementation of this method is provided from product search below:

    updateResults: function(options) {
        return getProductSearchPromise(options);
    }

The options will be specific to each provider but should be similar to the following:

    var options = {
        sort: '' // string text representing the sort type
        filter: [] // array of filters in the following format [ 'filterName', [1,2,3,4] ],
        start: [num] // used to specify the start index for the result set,
        rows: [num] // used to specify the number of rows from the start to return,
    }

**Select Group Promise**

Delegate method used to select a group when a product group is clicked on in the page

This method will usually just make a location change as in the following example from product lists:

    selectGroupPromise: function( list ) {
        var listId = list.listId;
        $location.path( 'personal-list/' + listId );
    }

### Product View Controllers

#### ProductViewController

This is the controller that is injected into the main view template on route resolve.

Scope Methods:

> infiniteScrollHandler() - callback send to the infinite scroll directive to be called when the scroll threshold is surpassed

> openItemDetail( productId ) - call to the product item detail service used to sync the current product to the item detail view before it is opened

> selectGroup( productGroup ) - used to call the method `config.functions.selectGroupPromise` and will update the product results on resolve of the returned promise

Scope Variables:

> viewType (this variable is watched for changes) - used to toggle between list and grid view

> headerButtonActive (this variable is watched for changes) - used with the edit button functionality to hide show content if edit mode is active

> productData - retrieved from the resolved data object

> config - retrieved from the resolved data object

#### ProductViewSubheaderController

This controller is used to handle user interactions in the header of the product view page

Scope Methods:

> toggleViewType - used to toggle the view type stored in the ProductViewSubheaderService

> openRefineView - calls the following method call -> $scope.openNamedModalView( 'modal-right', 'refine' );

> toggleEditMode - used to toggle the edit mode for the product display

Scope Variables:

> viewType (this variable is watched for changes) - ['grid'|'list']

> headerText (this variable is watched for changes) - object from the config object within the data object

> showMobileBackButton (this variable is watched for changes) - used with the ProductViewTreeController

> showEditButton (this variable is watched for changes) - used to show or hide the edit button depending on the configuration of the provided service

> headerButtonActive (this variable is watched for changes) - used to provide whether or not the edit button is active

> sortTypes - used to provide the sort types the user can choose from (this can be overridden from the provider config)

#### ProductViewRefineController

This controller is used to monitor user interactions and the state of the product result refine overlay

Scope Methods:

> hasFilter - used to check if a filter is active

> resetFilters - used to clear all selected filters

> resetFiltersByType - used to clear selected filters by facet name

> toggleFilter(type, filterId) - used to select/deselect a filter

Scope Variables:

> facets - returns the current set of facets available for the user to choose from

### Services

The is a set of underlying services that handle the syncing of data between the three controllers

## Reviews
- - -


## Scroll
- - -


## Shared
- - -


## Tabs
- - -


## View Helper
- - -
