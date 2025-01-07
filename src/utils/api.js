export async function apiRequest(path, method = 'GET', body = null, headers = {}) {
  try {
    const apiUrl = process.env.REACT_APP_API_URL;
    const options = {
      method,
      headers: {
        ...headers, // Default headers
      },
    };

    // If body is provided, handle based on its type
    if (body) {
      if (body instanceof FormData) {
        // FormData automatically sets the correct Content-Type
        options.body = body;
      } else {
        // Assume JSON if not FormData
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
      }
    }

    const url = `${apiUrl}/${path}/`;
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
