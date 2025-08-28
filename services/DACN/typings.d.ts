export declare namespace DACN {
  type LoginRequestDto = {
    email: string;
    password: string;
  };
  type TokenResponse = {
    access_token: string;
  };
  type TokenResponseDto = {
    statusCode: number;
    message: string;
    data: TokenResponse;
  };
}
